from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import mongodb
from app.expenses.schemas import (
    ExpenseCreateRequest, ExpenseUpdateRequest, ExpenseResponse, Settlement,
    OptimizedSettlement, SettlementCreateRequest, SettlementStatus, SplitType
)
import asyncio
from collections import defaultdict, deque

class ExpenseService:
    def __init__(self):
        pass
    
    @property
    def expenses_collection(self):
        return mongodb.database.expenses
    
    @property
    def settlements_collection(self):
        return mongodb.database.settlements
    
    @property
    def groups_collection(self):
        return mongodb.database.groups
    
    @property
    def users_collection(self):
        return mongodb.database.users

    async def create_expense(self, group_id: str, expense_data: ExpenseCreateRequest, user_id: str) -> Dict[str, Any]:
        """Create a new expense and calculate settlements"""
        
        # Validate and convert group_id to ObjectId
        try:
            group_obj_id = ObjectId(group_id)
        except Exception:
            raise ValueError("Group not found or user not a member")
        
        # Verify user is member of the group
        group = await self.groups_collection.find_one({
            "_id": group_obj_id,
            "members.userId": user_id
        })
        if not group:
            raise ValueError("Group not found or user not a member")

        # Create expense document
        expense_doc = {
            "_id": ObjectId(),
            "groupId": group_id,
            "createdBy": user_id,
            "description": expense_data.description,
            "amount": expense_data.amount,
            "splits": [split.model_dump() for split in expense_data.splits],
            "splitType": expense_data.splitType,
            "tags": expense_data.tags or [],
            "receiptUrls": expense_data.receiptUrls or [],
            "comments": [],
            "history": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        # Insert expense
        await self.expenses_collection.insert_one(expense_doc)

        # Create settlements
        settlements = await self._create_settlements_for_expense(expense_doc, user_id)

        # Get optimized settlements for the group
        optimized_settlements = await self.calculate_optimized_settlements(group_id)

        # Get group summary
        group_summary = await self._get_group_summary(group_id, optimized_settlements)

        # Convert expense to response format
        expense_response = await self._expense_doc_to_response(expense_doc)

        return {
            "expense": expense_response,
            "settlements": settlements,
            "groupSummary": group_summary
        }

    async def _create_settlements_for_expense(self, expense_doc: Dict[str, Any], payer_id: str) -> List[Settlement]:
        """Create settlement records for an expense"""
        settlements = []
        expense_id = str(expense_doc["_id"])
        group_id = expense_doc["groupId"]

        # Get user names for the settlements
        user_ids = [split["userId"] for split in expense_doc["splits"]] + [payer_id]
        users = await self.users_collection.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids]}}).to_list(None)
        user_names = {str(user["_id"]): user.get("name", "Unknown") for user in users}

        for split in expense_doc["splits"]:
            settlement_doc = {
                "_id": ObjectId(),
                "expenseId": expense_id,
                "groupId": group_id,
                "payerId": payer_id,
                "payeeId": split["userId"],
                "payerName": user_names.get(payer_id, "Unknown"),
                "payeeName": user_names.get(split["userId"], "Unknown"),
                "amount": split["amount"],
                "status": "completed" if split["userId"] == payer_id else "pending",
                "description": f"Share for {expense_doc['description']}",
                "createdAt": datetime.utcnow()
            }

            await self.settlements_collection.insert_one(settlement_doc)
            
            # Convert to Settlement model
            settlement = Settlement(**{
                **settlement_doc,
                "_id": str(settlement_doc["_id"])
            })
            settlements.append(settlement)

        return settlements

    async def list_group_expenses(self, group_id: str, user_id: str, page: int = 1, limit: int = 20, 
                                 from_date: Optional[datetime] = None, to_date: Optional[datetime] = None,
                                 tags: Optional[List[str]] = None) -> Dict[str, Any]:
        """List expenses for a group with pagination and filtering"""
        
        # Verify user access
        group = await self.groups_collection.find_one({
            "_id": ObjectId(group_id),
            "members.userId": user_id
        })
        if not group:
            raise ValueError("Group not found or user not a member")

        # Build query
        query = {"groupId": group_id}
        
        if from_date or to_date:
            date_filter = {}
            if from_date:
                date_filter["$gte"] = from_date
            if to_date:
                date_filter["$lte"] = to_date
            query["createdAt"] = date_filter

        if tags:
            query["tags"] = {"$in": tags}

        # Get total count
        total = await self.expenses_collection.count_documents(query)

        # Get expenses with pagination
        skip = (page - 1) * limit
        expenses_cursor = self.expenses_collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)
        expenses_docs = await expenses_cursor.to_list(None)

        expenses = []
        for doc in expenses_docs:
            expense = await self._expense_doc_to_response(doc)
            expenses.append(expense)

        # Calculate summary
        pipeline = [
            {"$match": query},
            {"$group": {
                "_id": None,
                "totalAmount": {"$sum": "$amount"},
                "expenseCount": {"$sum": 1},
                "avgExpense": {"$avg": "$amount"}
            }}
        ]
        summary_result = await self.expenses_collection.aggregate(pipeline).to_list(None)
        summary = summary_result[0] if summary_result else {
            "totalAmount": 0,
            "expenseCount": 0,
            "avgExpense": 0
        }
        summary.pop("_id", None)

        return {
            "expenses": expenses,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": (total + limit - 1) // limit,
                "hasNext": page * limit < total,
                "hasPrev": page > 1
            },
            "summary": summary
        }

    async def get_expense_by_id(self, group_id: str, expense_id: str, user_id: str) -> Dict[str, Any]:
        """Get a single expense with details"""
        
        # Validate ObjectIds
        try:
            group_obj_id = ObjectId(group_id)
            expense_obj_id = ObjectId(expense_id)
        except Exception:
            raise ValueError("Group not found or user not a member")
        
        # Verify user access
        group = await self.groups_collection.find_one({
            "_id": group_obj_id,
            "members.userId": user_id
        })
        if not group:
            raise ValueError("Group not found or user not a member")

        expense_doc = await self.expenses_collection.find_one({
            "_id": expense_obj_id,
            "groupId": group_id
        })
        if not expense_doc:
            raise ValueError("Expense not found")

        expense = await self._expense_doc_to_response(expense_doc)

        # Get related settlements
        settlements_docs = await self.settlements_collection.find({
            "expenseId": expense_id
        }).to_list(None)

        settlements = []
        for doc in settlements_docs:
            settlement = Settlement(**{
                **doc,
                "_id": str(doc["_id"])
            })
            settlements.append(settlement)

        return {
            "expense": expense,
            "relatedSettlements": settlements
        }

    async def update_expense(self, group_id: str, expense_id: str, updates: ExpenseUpdateRequest, user_id: str) -> ExpenseResponse:
        """Update an expense"""
        
        try:
            # Validate ObjectId format
            try:
                expense_obj_id = ObjectId(expense_id)
            except Exception as e:
                raise ValueError(f"Invalid expense ID format: {expense_id}")
            
            # Verify user access and that they created the expense
            expense_doc = await self.expenses_collection.find_one({
                "_id": expense_obj_id,
                "groupId": group_id,
                "createdBy": user_id
            })
            if not expense_doc:
                raise ValueError("Expense not found or not authorized to edit")

            # Validate splits against current or new amount if both are being updated
            if updates.splits is not None and updates.amount is not None:
                total_split = sum(split.amount for split in updates.splits)
                if abs(total_split - updates.amount) > 0.01:
                    raise ValueError('Split amounts must sum to total expense amount')
            
            # If only splits are being updated, validate against current amount
            elif updates.splits is not None:
                current_amount = expense_doc["amount"]
                total_split = sum(split.amount for split in updates.splits)
                if abs(total_split - current_amount) > 0.01:
                    raise ValueError('Split amounts must sum to current expense amount')

            # Store original data for history
            original_data = {
                "amount": expense_doc["amount"],
                "description": expense_doc["description"],
                "splits": expense_doc["splits"]
            }

            # Build update document
            update_doc = {"updatedAt": datetime.utcnow()}
            
            if updates.description is not None:
                update_doc["description"] = updates.description
            if updates.amount is not None:
                update_doc["amount"] = updates.amount
            if updates.splits is not None:
                update_doc["splits"] = [split.model_dump() for split in updates.splits]
            if updates.tags is not None:
                update_doc["tags"] = updates.tags
            if updates.receiptUrls is not None:
                update_doc["receiptUrls"] = updates.receiptUrls

            # Only add history if there are actual changes
            if len(update_doc) > 1:  # More than just updatedAt
                # Get user name
                try:
                    user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
                    user_name = user.get("name", "Unknown User") if user else "Unknown User"
                except:
                    user_name = "Unknown User"
                
                history_entry = {
                    "_id": ObjectId(),
                    "userId": user_id,
                    "userName": user_name,
                    "beforeData": original_data,
                    "editedAt": datetime.utcnow()
                }

                # Update expense with both $set and $push operations
                result = await self.expenses_collection.update_one(
                    {"_id": expense_obj_id},
                    {
                        "$set": update_doc,
                        "$push": {"history": history_entry}
                    }
                )
                
                if result.matched_count == 0:
                    raise ValueError("Expense not found during update")
            else:
                # No actual changes, just update the timestamp
                result = await self.expenses_collection.update_one(
                    {"_id": expense_obj_id},
                    {"$set": update_doc}
                )
                
                if result.matched_count == 0:
                    raise ValueError("Expense not found during update")

            # If splits changed, recalculate settlements
            if updates.splits is not None or updates.amount is not None:
                try:
                    # Delete old settlements for this expense
                    await self.settlements_collection.delete_many({"expenseId": expense_id})
                    
                    # Get updated expense
                    updated_expense = await self.expenses_collection.find_one({"_id": expense_obj_id})
                    
                    if updated_expense:
                        # Create new settlements
                        await self._create_settlements_for_expense(updated_expense, user_id)
                except Exception as e:
                    print(f"Warning: Failed to recalculate settlements: {e}")
                    # Continue anyway, as the expense update succeeded

            # Return updated expense
            updated_expense = await self.expenses_collection.find_one({"_id": expense_obj_id})
            if not updated_expense:
                raise ValueError("Failed to retrieve updated expense")
                
            return await self._expense_doc_to_response(updated_expense)
            
        except ValueError:
            raise
        except Exception as e:
            print(f"Error in update_expense: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Database error during expense update: {str(e)}")

    async def delete_expense(self, group_id: str, expense_id: str, user_id: str) -> bool:
        """Delete an expense"""
        
        # Verify user access and that they created the expense
        expense_doc = await self.expenses_collection.find_one({
            "_id": ObjectId(expense_id),
            "groupId": group_id,
            "createdBy": user_id
        })
        if not expense_doc:
            raise ValueError("Expense not found or not authorized to delete")

        # Delete settlements for this expense
        await self.settlements_collection.delete_many({"expenseId": expense_id})

        # Delete the expense
        result = await self.expenses_collection.delete_one({"_id": ObjectId(expense_id)})
        return result.deleted_count > 0

    async def calculate_optimized_settlements(self, group_id: str, algorithm: str = "advanced") -> List[OptimizedSettlement]:
        """Calculate optimized settlements using specified algorithm"""
        
        if algorithm == "normal":
            return await self._calculate_normal_settlements(group_id)
        else:
            return await self._calculate_advanced_settlements(group_id)

    async def _calculate_normal_settlements(self, group_id: str) -> List[OptimizedSettlement]:
        """Normal splitting algorithm - simplifies only direct relationships"""
        
        # Get all pending settlements for the group
        settlements = await self.settlements_collection.find({
            "groupId": group_id,
            "status": "pending"
        }).to_list(None)

        # Calculate net balances between each pair of users
        net_balances = defaultdict(lambda: defaultdict(float))
        user_names = {}

        for settlement in settlements:
            payer = settlement["payerId"]
            payee = settlement["payeeId"]
            amount = settlement["amount"]
            
            user_names[payer] = settlement["payerName"]
            user_names[payee] = settlement["payeeName"]
            
            # Net amount that payer owes to payee
            net_balances[payer][payee] += amount

        # Simplify direct relationships only
        optimized = []
        for payer in net_balances:
            for payee in net_balances[payer]:
                payer_owes_payee = net_balances[payer][payee]
                payee_owes_payer = net_balances[payee][payer]
                
                net_amount = payer_owes_payee - payee_owes_payer
                
                if net_amount > 0.01:  # Payer owes payee
                    optimized.append(OptimizedSettlement(
                        fromUserId=payer,
                        toUserId=payee,
                        fromUserName=user_names.get(payer, "Unknown"),
                        toUserName=user_names.get(payee, "Unknown"),
                        amount=round(net_amount, 2)
                    ))
                elif net_amount < -0.01:  # Payee owes payer
                    optimized.append(OptimizedSettlement(
                        fromUserId=payee,
                        toUserId=payer,
                        fromUserName=user_names.get(payee, "Unknown"),
                        toUserName=user_names.get(payer, "Unknown"),
                        amount=round(-net_amount, 2)
                    ))

        return optimized

    async def _calculate_advanced_settlements(self, group_id: str) -> List[OptimizedSettlement]:
        """Advanced settlement algorithm using graph optimization"""
        
        # Get all pending settlements for the group
        settlements = await self.settlements_collection.find({
            "groupId": group_id,
            "status": "pending"
        }).to_list(None)

        # Calculate net balance for each user (what they owe - what they are owed)
        user_balances = defaultdict(float)
        user_names = {}

        for settlement in settlements:
            payer = settlement["payerId"]
            payee = settlement["payeeId"]
            amount = settlement["amount"]
            
            user_names[payer] = settlement["payerName"]
            user_names[payee] = settlement["payeeName"]
            
            # Payer paid for payee, so payee owes payer
            user_balances[payee] += amount  # Positive means owes money
            user_balances[payer] -= amount  # Negative means is owed money

        # Separate debtors (positive balance) and creditors (negative balance)
        debtors = []  # (user_id, amount_owed)
        creditors = []  # (user_id, amount_owed_to_them)

        for user_id, balance in user_balances.items():
            if balance > 0.01:
                debtors.append([user_id, balance])
            elif balance < -0.01:
                creditors.append([user_id, -balance])

        # Sort debtors by amount owed (descending)
        debtors.sort(key=lambda x: x[1], reverse=True)
        # Sort creditors by amount owed to them (descending)
        creditors.sort(key=lambda x: x[1], reverse=True)

        # Use two-pointer technique to minimize transactions
        optimized = []
        i, j = 0, 0

        while i < len(debtors) and j < len(creditors):
            debtor_id, debt_amount = debtors[i]
            creditor_id, credit_amount = creditors[j]

            # Settle the minimum of what debtor owes and what creditor is owed
            settlement_amount = min(debt_amount, credit_amount)

            if settlement_amount > 0.01:
                optimized.append(OptimizedSettlement(
                    fromUserId=debtor_id,
                    toUserId=creditor_id,
                    fromUserName=user_names.get(debtor_id, "Unknown"),
                    toUserName=user_names.get(creditor_id, "Unknown"),
                    amount=round(settlement_amount, 2)
                ))

            # Update remaining amounts
            debtors[i][1] -= settlement_amount
            creditors[j][1] -= settlement_amount

            # Move to next debtor if current one is settled
            if debtors[i][1] <= 0.01:
                i += 1

            # Move to next creditor if current one is settled
            if creditors[j][1] <= 0.01:
                j += 1

        return optimized

    async def create_manual_settlement(self, group_id: str, settlement_data: SettlementCreateRequest, user_id: str) -> Settlement:
        """Create a manual settlement record"""
        
        # Verify user access
        group = await self.groups_collection.find_one({
            "_id": ObjectId(group_id),
            "members.userId": user_id
        })
        if not group:
            raise ValueError("Group not found or user not a member")

        # Get user names
        users = await self.users_collection.find({
            "_id": {"$in": [ObjectId(settlement_data.payer_id), ObjectId(settlement_data.payee_id)]}
        }).to_list(None)
        user_names = {str(user["_id"]): user.get("name", "Unknown") for user in users}

        settlement_doc = {
            "_id": ObjectId(),
            "expenseId": None,  # Manual settlement
            "groupId": group_id,
            "payerId": settlement_data.payer_id,
            "payeeId": settlement_data.payee_id,
            "payerName": user_names.get(settlement_data.payer_id, "Unknown"),
            "payeeName": user_names.get(settlement_data.payee_id, "Unknown"),
            "amount": settlement_data.amount,
            "status": "completed",
            "description": settlement_data.description or "Manual settlement",
            "paidAt": settlement_data.paidAt or datetime.utcnow(),
            "createdAt": datetime.utcnow()
        }

        await self.settlements_collection.insert_one(settlement_doc)

        return Settlement(**{
            **settlement_doc,
            "_id": str(settlement_doc["_id"])
        })

    async def _expense_doc_to_response(self, doc: Dict[str, Any]) -> ExpenseResponse:
        """Convert expense document to response model"""
        return ExpenseResponse(**{
            **doc,
            "_id": str(doc["_id"])
        })

    async def _get_group_summary(self, group_id: str, optimized_settlements: List[OptimizedSettlement]) -> Dict[str, Any]:
        """Get group summary statistics"""
        
        # Get total expenses
        pipeline = [
            {"$match": {"groupId": group_id}},
            {"$group": {
                "_id": None,
                "totalExpenses": {"$sum": "$amount"},
                "expenseCount": {"$sum": 1}
            }}
        ]
        expense_result = await self.expenses_collection.aggregate(pipeline).to_list(None)
        expense_stats = expense_result[0] if expense_result else {"totalExpenses": 0, "expenseCount": 0}

        # Get total settlements count
        settlement_count = await self.settlements_collection.count_documents({"groupId": group_id})

        return {
            "totalExpenses": expense_stats["totalExpenses"],
            "totalSettlements": settlement_count,
            "optimizedSettlements": optimized_settlements
        }

    async def get_group_settlements(self, group_id: str, user_id: str, status_filter: Optional[str] = None, 
                                   page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """Get settlements for a group with pagination"""
        
        # Verify user access
        group = await self.groups_collection.find_one({
            "_id": ObjectId(group_id),
            "members.userId": user_id
        })
        if not group:
            raise ValueError("Group not found or user not a member")

        # Build query
        query = {"groupId": group_id}
        if status_filter:
            query["status"] = status_filter

        # Get total count
        total = await self.settlements_collection.count_documents(query)

        # Get settlements with pagination
        skip = (page - 1) * limit
        settlements_docs = await self.settlements_collection.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(None)

        settlements = []
        for doc in settlements_docs:
            settlement = Settlement(**{
                **doc,
                "_id": str(doc["_id"])
            })
            settlements.append(settlement)

        return {
            "settlements": settlements,
            "total": total,
            "page": page,
            "limit": limit
        }

    async def get_settlement_by_id(self, group_id: str, settlement_id: str, user_id: str) -> Settlement:
        """Get a single settlement by ID"""
        
        # Verify user access
        group = await self.groups_collection.find_one({
            "_id": ObjectId(group_id),
            "members.userId": user_id
        })
        if not group:
            raise ValueError("Group not found or user not a member")

        settlement_doc = await self.settlements_collection.find_one({
            "_id": ObjectId(settlement_id),
            "groupId": group_id
        })
        
        if not settlement_doc:
            raise ValueError("Settlement not found")

        return Settlement(**{
            **settlement_doc,
            "_id": str(settlement_doc["_id"])
        })

    async def update_settlement_status(self, group_id: str, settlement_id: str, status: SettlementStatus, 
                                     paid_at: Optional[datetime] = None, user_id: str = None) -> Settlement:
        """Update settlement status"""
        
        update_doc = {
            "status": status.value,
            "updatedAt": datetime.utcnow()
        }
        
        if paid_at:
            update_doc["paidAt"] = paid_at

        result = await self.settlements_collection.update_one(
            {"_id": ObjectId(settlement_id), "groupId": group_id},
            {"$set": update_doc}
        )

        if result.matched_count == 0:
            raise ValueError("Settlement not found")

        # Get updated settlement
        settlement_doc = await self.settlements_collection.find_one({"_id": ObjectId(settlement_id)})
        
        return Settlement(**{
            **settlement_doc,
            "_id": str(settlement_doc["_id"])
        })

    async def delete_settlement(self, group_id: str, settlement_id: str, user_id: str) -> bool:
        """Delete a settlement"""
        
        # Verify user access
        group = await self.groups_collection.find_one({
            "_id": ObjectId(group_id),
            "members.userId": user_id
        })
        if not group:
            raise ValueError("Group not found or user not a member")

        result = await self.settlements_collection.delete_one({
            "_id": ObjectId(settlement_id),
            "groupId": group_id
        })

        return result.deleted_count > 0

    async def get_user_balance_in_group(self, group_id: str, target_user_id: str, current_user_id: str) -> Dict[str, Any]:
        """Get a user's balance within a specific group"""
        
        # Verify current user access
        group = await self.groups_collection.find_one({
            "_id": ObjectId(group_id),
            "members.userId": current_user_id
        })
        if not group:
            raise ValueError("Group not found or user not a member")

        # Get user info
        user = await self.users_collection.find_one({"_id": ObjectId(target_user_id)})
        user_name = user.get("name", "Unknown") if user else "Unknown"

        # Calculate totals from settlements
        pipeline = [
            {"$match": {
                "groupId": group_id,
                "$or": [
                    {"payerId": target_user_id},
                    {"payeeId": target_user_id}
                ]
            }},
            {"$group": {
                "_id": None,
                "totalPaid": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$payerId", target_user_id]},
                            "$amount",
                            0
                        ]
                    }
                },
                "totalOwed": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$payeeId", target_user_id]},
                            "$amount",
                            0
                        ]
                    }
                }
            }}
        ]

        result = await self.settlements_collection.aggregate(pipeline).to_list(None)
        balance_data = result[0] if result else {"totalPaid": 0, "totalOwed": 0}

        total_paid = balance_data["totalPaid"]
        total_owed = balance_data["totalOwed"]
        net_balance = total_paid - total_owed

        # Get pending settlements
        pending_settlements = await self.settlements_collection.find({
            "groupId": group_id,
            "payeeId": target_user_id,
            "status": "pending"
        }).to_list(None)

        pending_settlement_objects = []
        for doc in pending_settlements:
            settlement = Settlement(**{
                **doc,
                "_id": str(doc["_id"])
            })
            pending_settlement_objects.append(settlement)

        # Get recent expenses where user was involved
        recent_expenses = await self.expenses_collection.find({
            "groupId": group_id,
            "$or": [
                {"createdBy": target_user_id},
                {"splits.userId": target_user_id}
            ]
        }).sort("createdAt", -1).limit(5).to_list(None)

        recent_expense_data = []
        for expense in recent_expenses:
            # Find user's share
            user_share = 0
            for split in expense["splits"]:
                if split["userId"] == target_user_id:
                    user_share = split["amount"]
                    break

            recent_expense_data.append({
                "expenseId": str(expense["_id"]),
                "description": expense["description"],
                "userShare": user_share,
                "createdAt": expense["createdAt"]
            })

        return {
            "userId": target_user_id,
            "userName": user_name,
            "totalPaid": total_paid,
            "totalOwed": total_owed,
            "netBalance": net_balance,
            "owesYou": net_balance > 0,
            "pendingSettlements": pending_settlement_objects,
            "recentExpenses": recent_expense_data
        }

    async def get_friends_balance_summary(self, user_id: str) -> Dict[str, Any]:
        """Get cross-group friend balances for a user"""
        
        # Get all groups user belongs to
        groups = await self.groups_collection.find({
            "members.userId": user_id
        }).to_list(None)

        friends_balance = []
        user_totals = {"totalOwedToYou": 0, "totalYouOwe": 0}

        # Get all unique friends across groups
        friend_ids = set()
        for group in groups:
            for member in group["members"]:
                if member["userId"] != user_id:
                    friend_ids.add(member["userId"])

        # Get user names
        users = await self.users_collection.find({
            "_id": {"$in": [ObjectId(uid) for uid in friend_ids]}
        }).to_list(None)
        user_names = {str(user["_id"]): user.get("name", "Unknown") for user in users}

        for friend_id in friend_ids:
            friend_balance_data = {
                "userId": friend_id,
                "userName": user_names.get(friend_id, "Unknown"),
                "userImageUrl": None,  # Would need to be fetched from user profile
                "netBalance": 0,
                "owesYou": False,
                "breakdown": [],
                "lastActivity": datetime.utcnow()
            }

            total_friend_balance = 0

            # Calculate balance for each group
            for group in groups:
                group_id = str(group["_id"])
                
                # Check if friend is in this group
                friend_in_group = any(member["userId"] == friend_id for member in group["members"])
                if not friend_in_group:
                    continue

                # Calculate net balance between user and friend in this group
                pipeline = [
                    {"$match": {
                        "groupId": group_id,
                        "$or": [
                            {"payerId": user_id, "payeeId": friend_id},
                            {"payerId": friend_id, "payeeId": user_id}
                        ]
                    }},
                    {"$group": {
                        "_id": None,
                        "userOwes": {
                            "$sum": {
                                "$cond": [
                                    {"$and": [
                                        {"$eq": ["$payerId", friend_id]},
                                        {"$eq": ["$payeeId", user_id]}
                                    ]},
                                    "$amount",
                                    0
                                ]
                            }
                        },
                        "friendOwes": {
                            "$sum": {
                                "$cond": [
                                    {"$and": [
                                        {"$eq": ["$payerId", user_id]},
                                        {"$eq": ["$payeeId", friend_id]}
                                    ]},
                                    "$amount",
                                    0
                                ]
                            }
                        }
                    }}
                ]

                result = await self.settlements_collection.aggregate(pipeline).to_list(None)
                balance_data = result[0] if result else {"userOwes": 0, "friendOwes": 0}

                group_balance = balance_data["friendOwes"] - balance_data["userOwes"]
                total_friend_balance += group_balance

                if abs(group_balance) > 0.01:  # Only include if there's a significant balance
                    friend_balance_data["breakdown"].append({
                        "groupId": group_id,
                        "groupName": group["name"],
                        "balance": group_balance,
                        "owesYou": group_balance > 0
                    })

            if abs(total_friend_balance) > 0.01:  # Only include friends with non-zero balance
                friend_balance_data["netBalance"] = total_friend_balance
                friend_balance_data["owesYou"] = total_friend_balance > 0
                
                if total_friend_balance > 0:
                    user_totals["totalOwedToYou"] += total_friend_balance
                else:
                    user_totals["totalYouOwe"] += abs(total_friend_balance)

                friends_balance.append(friend_balance_data)

        return {
            "friendsBalance": friends_balance,
            "summary": {
                "totalOwedToYou": user_totals["totalOwedToYou"],
                "totalYouOwe": user_totals["totalYouOwe"],
                "netBalance": user_totals["totalOwedToYou"] - user_totals["totalYouOwe"],
                "friendCount": len(friends_balance),
                "activeGroups": len(groups)
            }
        }

    async def get_overall_balance_summary(self, user_id: str) -> Dict[str, Any]:
        """Get overall balance summary for a user"""
        
        # Get all groups user belongs to
        groups = await self.groups_collection.find({
            "members.userId": user_id
        }).to_list(None)

        total_owed_to_you = 0
        total_you_owe = 0
        groups_summary = []

        for group in groups:
            group_id = str(group["_id"])
            
            # Calculate user's balance in this group
            pipeline = [
                {"$match": {
                    "groupId": group_id,
                    "$or": [
                        {"payerId": user_id},
                        {"payeeId": user_id}
                    ]
                }},
                {"$group": {
                    "_id": None,
                    "totalPaid": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$payerId", user_id]},
                                "$amount",
                                0
                            ]
                        }
                    },
                    "totalOwed": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$payeeId", user_id]},
                                "$amount",
                                0
                            ]
                        }
                    }
                }}
            ]

            result = await self.settlements_collection.aggregate(pipeline).to_list(None)
            balance_data = result[0] if result else {"totalPaid": 0, "totalOwed": 0}

            group_balance = balance_data["totalPaid"] - balance_data["totalOwed"]
            
            if abs(group_balance) > 0.01:  # Only include groups with significant balance
                groups_summary.append({
                    "group_id": group_id,
                    "group_name": group["name"],
                    "yourBalanceInGroup": group_balance
                })

                if group_balance > 0:
                    total_owed_to_you += group_balance
                else:
                    total_you_owe += abs(group_balance)

        return {
            "totalOwedToYou": total_owed_to_you,
            "totalYouOwe": total_you_owe,
            "netBalance": total_owed_to_you - total_you_owe,
            "currency": "USD",
            "groupsSummary": groups_summary
        }

    async def get_group_analytics(self, group_id: str, user_id: str, period: str = "month", 
                                 year: int = None, month: int = None) -> Dict[str, Any]:
        """Get expense analytics for a group"""
        
        # Verify user access
        group = await self.groups_collection.find_one({
            "_id": ObjectId(group_id),
            "members.userId": user_id
        })
        if not group:
            raise ValueError("Group not found or user not a member")

        # Build date range
        if period == "month" and year and month:
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
            period_str = f"{year}-{month:02d}"
        elif period == "year" and year:
            start_date = datetime(year, 1, 1)
            end_date = datetime(year + 1, 1, 1)
            period_str = str(year)
        else:
            # Default to current month
            now = datetime.utcnow()
            start_date = datetime(now.year, now.month, 1)
            if now.month == 12:
                end_date = datetime(now.year + 1, 1, 1)
            else:
                end_date = datetime(now.year, now.month + 1, 1)
            period_str = f"{now.year}-{now.month:02d}"

        # Get expenses in the period
        expenses = await self.expenses_collection.find({
            "groupId": group_id,
            "createdAt": {"$gte": start_date, "$lt": end_date}
        }).to_list(None)

        total_expenses = sum(expense["amount"] for expense in expenses)
        expense_count = len(expenses)
        avg_expense = total_expenses / expense_count if expense_count > 0 else 0

        # Analyze categories (tags)
        tag_stats = defaultdict(lambda: {"amount": 0, "count": 0})
        for expense in expenses:
            for tag in expense.get("tags", ["uncategorized"]):
                tag_stats[tag]["amount"] += expense["amount"]
                tag_stats[tag]["count"] += 1

        top_categories = []
        for tag, stats in sorted(tag_stats.items(), key=lambda x: x[1]["amount"], reverse=True):
            top_categories.append({
                "tag": tag,
                "amount": stats["amount"],
                "count": stats["count"],
                "percentage": round((stats["amount"] / total_expenses * 100) if total_expenses > 0 else 0, 1)
            })

        # Member contributions
        member_contributions = []
        group_members = {member["userId"]: member for member in group["members"]}
        
        for member_id in group_members:
            # Get user info
            user = await self.users_collection.find_one({"_id": ObjectId(member_id)})
            user_name = user.get("name", "Unknown") if user else "Unknown"
            
            # Calculate contributions
            total_paid = sum(expense["amount"] for expense in expenses if expense["createdBy"] == member_id)
            
            total_owed = 0
            for expense in expenses:
                for split in expense["splits"]:
                    if split["userId"] == member_id:
                        total_owed += split["amount"]

            member_contributions.append({
                "userId": member_id,
                "userName": user_name,
                "totalPaid": total_paid,
                "totalOwed": total_owed,
                "netContribution": total_paid - total_owed
            })

        # Expense trends (daily)
        expense_trends = []
        current_date = start_date
        while current_date < end_date:
            day_expenses = [e for e in expenses if e["createdAt"].date() == current_date.date()]
            expense_trends.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "amount": sum(e["amount"] for e in day_expenses),
                "count": len(day_expenses)
            })
            current_date += timedelta(days=1)

        return {
            "period": period_str,
            "totalExpenses": total_expenses,
            "expenseCount": expense_count,
            "avgExpenseAmount": round(avg_expense, 2),
            "topCategories": top_categories[:10],  # Top 10 categories
            "memberContributions": member_contributions,
            "expenseTrends": expense_trends
        }
# Create service instance
expense_service = ExpenseService()
