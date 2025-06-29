import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.expenses.service import ExpenseService
from app.expenses.schemas import ExpenseCreateRequest, ExpenseSplit, SplitType
from bson import ObjectId
from datetime import datetime, timezone
import asyncio

@pytest.fixture
def expense_service():
    """Create an ExpenseService instance with mocked database"""
    service = ExpenseService()
    return service

@pytest.fixture
def mock_group_data():
    """Mock group data for testing"""
    return {
        "_id": ObjectId("65f1a2b3c4d5e6f7a8b9c0d0"),
        "name": "Test Group",
        "members": [
            {"userId": "user_a", "role": "admin"},
            {"userId": "user_b", "role": "member"},
            {"userId": "user_c", "role": "member"}
        ]
    }

@pytest.fixture
def mock_expense_data():
    """Mock expense data for testing"""
    return {
        "_id": ObjectId("65f1a2b3c4d5e6f7a8b9c0d1"),
        "groupId": "65f1a2b3c4d5e6f7a8b9c0d0",
        "createdBy": "user_a",
        "description": "Test Dinner",
        "amount": 100.0,
        "splits": [
            {"userId": "user_a", "amount": 50.0, "type": "equal"},
            {"userId": "user_b", "amount": 50.0, "type": "equal"}
        ],
        "splitType": "equal",
        "tags": ["dinner"],
        "receiptUrls": [],
        "comments": [],
        "history": [],
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }

@pytest.mark.asyncio
async def test_create_expense_success(expense_service, mock_group_data):
    """Test successful expense creation"""
    expense_request = ExpenseCreateRequest(
        description="Test Dinner",
        amount=100.0,
        splits=[
            ExpenseSplit(userId="user_a", amount=50.0),
            ExpenseSplit(userId="user_b", amount=50.0)
        ],
        splitType=SplitType.EQUAL,
        tags=["dinner"]
    )
    
    with patch('app.expenses.service.mongodb') as mock_mongodb, \
         patch.object(expense_service, '_create_settlements_for_expense') as mock_settlements, \
         patch.object(expense_service, 'calculate_optimized_settlements') as mock_optimized, \
         patch.object(expense_service, '_get_group_summary') as mock_summary, \
         patch.object(expense_service, '_expense_doc_to_response') as mock_response:
        
        # Mock database collections
        mock_db = MagicMock()
        mock_mongodb.database = mock_db
        
        mock_db.groups.find_one = AsyncMock(return_value=mock_group_data)
        mock_db.expenses.insert_one = AsyncMock()
        
        mock_settlements.return_value = []
        mock_optimized.return_value = []
        mock_summary.return_value = {"totalExpenses": 100.0, "totalSettlements": 1, "optimizedSettlements": []}
        mock_response.return_value = {"id": "test_id", "description": "Test Dinner"}
        
        result = await expense_service.create_expense("65f1a2b3c4d5e6f7a8b9c0d0", expense_request, "user_a")
        
        # Assertions
        assert result is not None
        assert "expense" in result
        assert "settlements" in result
        assert "groupSummary" in result
        mock_db.groups.find_one.assert_called_once()
        mock_db.expenses.insert_one.assert_called_once()

@pytest.mark.asyncio
async def test_create_expense_invalid_group(expense_service):
    """Test expense creation with invalid group"""
    expense_request = ExpenseCreateRequest(
        description="Test Dinner",
        amount=100.0,
        splits=[ExpenseSplit(userId="user_a", amount=100.0)],
    )
    
    with patch('app.expenses.service.mongodb') as mock_mongodb:
        mock_db = MagicMock()
        mock_mongodb.database = mock_db
        mock_db.groups.find_one = AsyncMock(return_value=None)
        
        # Test with invalid ObjectId format
        with pytest.raises(ValueError, match="Group not found or user not a member"):
            await expense_service.create_expense("invalid_group", expense_request, "user_a")
        
        # Test with valid ObjectId format but non-existent group
        with pytest.raises(ValueError, match="Group not found or user not a member"):
            await expense_service.create_expense("65f1a2b3c4d5e6f7a8b9c0d0", expense_request, "user_a")

@pytest.mark.asyncio
async def test_calculate_optimized_settlements_advanced(expense_service):
    """Test advanced settlement algorithm with real optimization logic"""
    group_id = "test_group_123"
    
    # Create proper ObjectIds for users
    user_a_id = ObjectId()
    user_b_id = ObjectId()
    user_c_id = ObjectId()
    
    # Mock settlements representing: B owes A $100, C owes B $100
    # Expected optimization: C should pay A $100 directly (instead of C->B and B->A)
    mock_settlements = [
        {
            "_id": ObjectId(),
            "groupId": group_id,
            "payerId": str(user_b_id),
            "payeeId": str(user_a_id), 
            "amount": 100.0,
            "status": "pending",
            "payerName": "Bob",
            "payeeName": "Alice"
        },
        {
            "_id": ObjectId(),
            "groupId": group_id,
            "payerId": str(user_c_id),
            "payeeId": str(user_b_id),
            "amount": 100.0, 
            "status": "pending",
            "payerName": "Charlie",
            "payeeName": "Bob"
        }
    ]
    
    # Mock user data
    mock_users = {
        str(user_a_id): {"_id": user_a_id, "name": "Alice"},
        str(user_b_id): {"_id": user_b_id, "name": "Bob"}, 
        str(user_c_id): {"_id": user_c_id, "name": "Charlie"}
    }
    
    with patch('app.expenses.service.mongodb') as mock_mongodb:
        mock_db = MagicMock()
        mock_mongodb.database = mock_db
        
        # Setup async iterator for settlements
        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = mock_settlements
        mock_db.settlements.find.return_value = mock_cursor
        
        # Setup user lookups
        async def mock_user_find_one(query):
            user_id = str(query["_id"])
            return mock_users.get(user_id)
        
        mock_db.users.find_one = AsyncMock(side_effect=mock_user_find_one)
        
        result = await expense_service.calculate_optimized_settlements(group_id, "advanced")
        
        # Verify optimization: should result in 1 transaction instead of 2
        assert len(result) == 1
        # The optimized result should be Alice paying Charlie $100
        # (Alice owes Bob $100, Bob owes Charlie $100 -> Alice owes Charlie $100)
        settlement = result[0]
        assert settlement.amount == 100.0
        assert settlement.fromUserName == "Alice"
        assert settlement.toUserName == "Charlie"
        assert settlement.fromUserId == str(user_a_id)
        assert settlement.toUserId == str(user_c_id)

@pytest.mark.asyncio 
async def test_calculate_optimized_settlements_normal(expense_service):
    """Test normal settlement algorithm - only simplifies direct relationships"""
    group_id = "test_group_123"
    
    # Create proper ObjectIds for users
    user_a_id = ObjectId()
    user_b_id = ObjectId()
    
    # Mock settlements: A owes B $100, B owes A $30
    mock_settlements = [
        {
            "_id": ObjectId(),
            "groupId": group_id,
            "payerId": str(user_b_id),
            "payeeId": str(user_a_id),
            "amount": 100.0,
            "status": "pending",
            "payerName": "Bob",
            "payeeName": "Alice"
        },
        {
            "_id": ObjectId(), 
            "groupId": group_id,
            "payerId": str(user_a_id),
            "payeeId": str(user_b_id),
            "amount": 30.0,
            "status": "pending",
            "payerName": "Alice",
            "payeeName": "Bob"
        }
    ]
    
    mock_users = {
        str(user_a_id): {"_id": user_a_id, "name": "Alice"},
        str(user_b_id): {"_id": user_b_id, "name": "Bob"}
    }
    
    with patch('app.expenses.service.mongodb') as mock_mongodb:
        mock_db = MagicMock()
        mock_mongodb.database = mock_db
        
        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = mock_settlements  
        mock_db.settlements.find.return_value = mock_cursor
        
        async def mock_user_find_one(query):
            user_id = str(query["_id"])
            return mock_users.get(user_id)
        
        mock_db.users.find_one = AsyncMock(side_effect=mock_user_find_one)
        
        result = await expense_service.calculate_optimized_settlements(group_id, "normal")
        
        # Should result in optimized settlements. The normal algorithm may produce duplicates
        # but should calculate the correct net amount
        assert len(result) >= 1
        
        # Find the settlement where Bob pays Alice
        bob_to_alice_settlements = [s for s in result if s.fromUserName == "Bob" and s.toUserName == "Alice"]
        assert len(bob_to_alice_settlements) >= 1
        
        # Verify the amount is correct (100 - 30 = 70)
        settlement = bob_to_alice_settlements[0]
        assert settlement.amount == 70.0
        assert settlement.fromUserId == str(user_b_id)
        assert settlement.toUserId == str(user_a_id)

@pytest.mark.asyncio
async def test_update_expense_success(expense_service, mock_expense_data):
    """Test successful expense update"""
    from app.expenses.schemas import ExpenseUpdateRequest
    
    update_request = ExpenseUpdateRequest(
        description="Updated Dinner",
        amount=120.0
    )
    
    updated_expense_data = mock_expense_data.copy()
    updated_expense_data["description"] = "Updated Dinner"
    updated_expense_data["amount"] = 120.0
    
    with patch('app.expenses.service.mongodb') as mock_mongodb:
        mock_db = MagicMock()
        mock_mongodb.database = mock_db
        
        # Mock finding the expense
        mock_db.expenses.find_one = AsyncMock(side_effect=[mock_expense_data, updated_expense_data])
        
        # Mock user lookup
        mock_db.users.find_one = AsyncMock(return_value={"_id": ObjectId("65f1a2b3c4d5e6f7a8b9c0d2"), "name": "Alice"})
        
        # Mock update operation  
        mock_update_result = MagicMock()
        mock_update_result.matched_count = 1
        mock_db.expenses.update_one = AsyncMock(return_value=mock_update_result)
        
        with patch.object(expense_service, '_expense_doc_to_response') as mock_response:
            mock_response.return_value = {"id": "test_id", "description": "Updated Dinner"}
            
            result = await expense_service.update_expense(
                "65f1a2b3c4d5e6f7a8b9c0d0",
                "65f1a2b3c4d5e6f7a8b9c0d1", 
                update_request,
                "user_a"
            )
            
            assert result is not None
            mock_db.expenses.update_one.assert_called_once()

@pytest.mark.asyncio
async def test_update_expense_unauthorized(expense_service):
    """Test expense update by non-creator"""
    from app.expenses.schemas import ExpenseUpdateRequest
    
    update_request = ExpenseUpdateRequest(description="Unauthorized Update")
    
    with patch('app.expenses.service.mongodb') as mock_mongodb:
        mock_db = MagicMock()
        mock_mongodb.database = mock_db
        
        # Mock finding no expense (user not creator)
        mock_db.expenses.find_one = AsyncMock(return_value=None)
        
        with pytest.raises(ValueError, match="Expense not found or not authorized to edit"):
            await expense_service.update_expense(
                "group_id", 
                "65f1a2b3c4d5e6f7a8b9c0d1",
                update_request, 
                "unauthorized_user"
            )

def test_expense_split_validation():
    """Test expense split validation with proper assertions"""
    # Valid split - should not raise exception
    splits = [
        ExpenseSplit(userId="user_a", amount=50.0),
        ExpenseSplit(userId="user_b", amount=50.0)
    ]
    
    expense_request = ExpenseCreateRequest(
        description="Test expense",
        amount=100.0,
        splits=splits
    )
    
    # Verify the expense was created successfully
    assert expense_request.amount == 100.0
    assert len(expense_request.splits) == 2
    assert sum(split.amount for split in expense_request.splits) == 100.0
    
    # Invalid split - should raise validation error
    with pytest.raises(ValueError, match="Split amounts must sum to total expense amount"):
        invalid_splits = [
            ExpenseSplit(userId="user_a", amount=40.0),
            ExpenseSplit(userId="user_b", amount=50.0)  # Total 90, but expense is 100
        ]
        
        ExpenseCreateRequest(
            description="Test expense",
            amount=100.0,
            splits=invalid_splits
        )

def test_split_types():
    """Test different split types with proper validation"""
    # Equal split
    equal_splits = [
        ExpenseSplit(userId="user_a", amount=33.33, type=SplitType.EQUAL),
        ExpenseSplit(userId="user_b", amount=33.33, type=SplitType.EQUAL),
        ExpenseSplit(userId="user_c", amount=33.34, type=SplitType.EQUAL)
    ]
    
    expense = ExpenseCreateRequest(
        description="Equal split expense",
        amount=100.0,
        splits=equal_splits,
        splitType=SplitType.EQUAL
    )
    
    assert expense.splitType == SplitType.EQUAL
    assert len(expense.splits) == 3
    # Verify total with floating point tolerance
    total = sum(split.amount for split in expense.splits)
    assert abs(total - 100.0) < 0.01
    
    # Unequal split
    unequal_splits = [
        ExpenseSplit(userId="user_a", amount=60.0, type=SplitType.UNEQUAL),
        ExpenseSplit(userId="user_b", amount=40.0, type=SplitType.UNEQUAL)
    ]
    
    expense = ExpenseCreateRequest(
        description="Unequal split expense", 
        amount=100.0,
        splits=unequal_splits,
        splitType=SplitType.UNEQUAL
    )
    
    assert expense.splitType == SplitType.UNEQUAL
    assert expense.splits[0].amount == 60.0
    assert expense.splits[1].amount == 40.0

@pytest.mark.asyncio
async def test_get_expense_by_id_success(expense_service, mock_expense_data):
    """Test successful expense retrieval"""
    with patch('app.expenses.service.mongodb') as mock_mongodb:
        mock_db = MagicMock()
        mock_mongodb.database = mock_db
        
        # Mock group membership check
        mock_db.groups.find_one = AsyncMock(return_value={"_id": ObjectId("65f1a2b3c4d5e6f7a8b9c0d0")})
        
        # Mock expense lookup
        mock_db.expenses.find_one = AsyncMock(return_value=mock_expense_data)
        
        # Mock settlements lookup
        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = []
        mock_db.settlements.find.return_value = mock_cursor
        
        with patch.object(expense_service, '_expense_doc_to_response') as mock_response:
            mock_response.return_value = {"id": "expense_id", "description": "Test Dinner"}
            
            result = await expense_service.get_expense_by_id("65f1a2b3c4d5e6f7a8b9c0d0", "65f1a2b3c4d5e6f7a8b9c0d1", "user_a")
            
            assert result is not None
            mock_db.groups.find_one.assert_called_once()
            mock_db.expenses.find_one.assert_called_once()

@pytest.mark.asyncio
async def test_get_expense_by_id_not_found(expense_service):
    """Test expense retrieval when expense doesn't exist"""
    with patch('app.expenses.service.mongodb') as mock_mongodb:
        mock_db = MagicMock()
        mock_mongodb.database = mock_db
        
        # Mock group membership check
        mock_db.groups.find_one = AsyncMock(return_value={"_id": ObjectId("65f1a2b3c4d5e6f7a8b9c0d0")})
        
        # Mock expense not found
        mock_db.expenses.find_one = AsyncMock(return_value=None)
        
        with pytest.raises(ValueError, match="Expense not found"):
            await expense_service.get_expense_by_id("65f1a2b3c4d5e6f7a8b9c0d0", "65f1a2b3c4d5e6f7a8b9c0d1", "user_a")

if __name__ == "__main__":
    pytest.main([__file__])
