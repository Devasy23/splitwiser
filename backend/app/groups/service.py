from fastapi import HTTPException, status
from app.database import get_database
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import secrets
import string

class GroupService:
    def __init__(self):
        pass

    def get_db(self):
        return get_database()

    def generate_join_code(self, length: int = 6) -> str:
        """Generate a random alphanumeric join code"""
        characters = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(characters) for _ in range(length))

    def transform_group_document(self, group: dict) -> dict:
        """Transform MongoDB group document to API response format"""
        if not group:
            return None
        try:
            group_id = str(group["_id"])
        except Exception:
            return None
        
        return {
            "_id": group_id,
            "name": group.get("name"),
            "currency": group.get("currency", "USD"),
            "joinCode": group.get("joinCode"),
            "createdBy": group.get("createdBy"),
            "createdAt": group.get("createdAt"),
            "imageUrl": group.get("imageUrl"),
            "members": group.get("members", [])
        }

    async def create_group(self, group_data: dict, user_id: str) -> dict:
        """Create a new group with the user as admin"""
        db = self.get_db()
        
        # Generate unique join code
        join_code = None
        for _ in range(10):  # Try up to 10 times to generate unique code
            join_code = self.generate_join_code()
            existing = await db.groups.find_one({"joinCode": join_code})
            if not existing:
                break
        
        if not join_code:
            raise HTTPException(status_code=500, detail="Failed to generate unique join code")

        now = datetime.now(timezone.utc)
        group_doc = {
            "name": group_data["name"],
            "currency": group_data.get("currency", "USD"),
            "imageUrl": group_data.get("imageUrl"),
            "joinCode": join_code,
            "createdBy": user_id,
            "createdAt": now,
            "members": [{
                "userId": user_id,
                "role": "admin",
                "joinedAt": now
            }]
        }
        
        result = await db.groups.insert_one(group_doc)
        created_group = await db.groups.find_one({"_id": result.inserted_id})
        return self.transform_group_document(created_group)

    async def get_user_groups(self, user_id: str) -> List[dict]:
        """Get all groups where user is a member"""
        db = self.get_db()
        cursor = db.groups.find({"members.userId": user_id})
        groups = []
        async for group in cursor:
            transformed = self.transform_group_document(group)
            if transformed:
                groups.append(transformed)
        return groups

    async def get_group_by_id(self, group_id: str, user_id: str) -> Optional[dict]:
        """Get group details by ID, only if user is a member"""
        db = self.get_db()
        try:
            obj_id = ObjectId(group_id)
        except Exception:
            return None
        
        group = await db.groups.find_one({
            "_id": obj_id,
            "members.userId": user_id
        })
        return self.transform_group_document(group)

    async def update_group(self, group_id: str, updates: dict, user_id: str) -> Optional[dict]:
        """Update group metadata (admin only)"""
        db = self.get_db()
        try:
            obj_id = ObjectId(group_id)
        except Exception:
            return None

        # Check if user is admin
        group = await db.groups.find_one({
            "_id": obj_id,
            "members": {"$elemMatch": {"userId": user_id, "role": "admin"}}
        })
        if not group:
            raise HTTPException(status_code=403, detail="Only group admins can update group details")

        result = await db.groups.find_one_and_update(
            {"_id": obj_id},
            {"$set": updates},
            return_document=True
        )
        return self.transform_group_document(result)

    async def delete_group(self, group_id: str, user_id: str) -> bool:
        """Delete group (admin only)"""
        db = self.get_db()
        try:
            obj_id = ObjectId(group_id)
        except Exception:
            return False

        # Check if user is admin
        group = await db.groups.find_one({
            "_id": obj_id,
            "members": {"$elemMatch": {"userId": user_id, "role": "admin"}}
        })
        if not group:
            raise HTTPException(status_code=403, detail="Only group admins can delete groups")

        result = await db.groups.delete_one({"_id": obj_id})
        return result.deleted_count == 1

    async def join_group_by_code(self, join_code: str, user_id: str) -> Optional[dict]:
        """Join a group using join code"""
        db = self.get_db()
        
        # Find group by join code
        group = await db.groups.find_one({"joinCode": join_code.upper()})
        if not group:
            raise HTTPException(status_code=404, detail="Invalid join code")

        # Check if user is already a member
        existing_member = next((m for m in group.get("members", []) if m["userId"] == user_id), None)
        if existing_member:
            raise HTTPException(status_code=400, detail="You are already a member of this group")

        # Add user as member
        new_member = {
            "userId": user_id,
            "role": "member",
            "joinedAt": datetime.now(timezone.utc)
        }

        result = await db.groups.find_one_and_update(
            {"_id": group["_id"]},
            {"$push": {"members": new_member}},
            return_document=True
        )
        return self.transform_group_document(result)

    async def leave_group(self, group_id: str, user_id: str) -> bool:
        """Leave a group (only if user has no outstanding balances)"""
        db = self.get_db()
        try:
            obj_id = ObjectId(group_id)
        except Exception:
            return False

        # Check if user is a member
        group = await db.groups.find_one({
            "_id": obj_id,
            "members.userId": user_id
        })
        if not group:
            raise HTTPException(status_code=404, detail="Group not found or you are not a member")

        # Check if user is the last admin
        user_member = next((m for m in group.get("members", []) if m["userId"] == user_id), None)
        if user_member and user_member["role"] == "admin":
            admin_count = sum(1 for m in group.get("members", []) if m["role"] == "admin")
            if admin_count <= 1:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot leave group when you are the only admin. Delete the group or promote another member to admin first."
                )

        # TODO: Check for outstanding balances with expense service
        # For now, we'll allow leaving without balance check
        # This should be implemented when expense service is ready

        result = await db.groups.update_one(
            {"_id": obj_id},
            {"$pull": {"members": {"userId": user_id}}}
        )
        return result.modified_count == 1

    async def get_group_members(self, group_id: str, user_id: str) -> List[dict]:
        """Get list of group members"""
        db = self.get_db()
        try:
            obj_id = ObjectId(group_id)
        except Exception:
            return []

        group = await db.groups.find_one({
            "_id": obj_id,
            "members.userId": user_id
        })
        if not group:
            return []

        return group.get("members", [])

    async def update_member_role(self, group_id: str, member_id: str, new_role: str, user_id: str) -> bool:
        """Update member role (admin only)"""
        db = self.get_db()
        try:
            obj_id = ObjectId(group_id)
        except Exception:
            return False

        # Check if user is admin
        group = await db.groups.find_one({
            "_id": obj_id,
            "members": {"$elemMatch": {"userId": user_id, "role": "admin"}}
        })
        if not group:
            raise HTTPException(status_code=403, detail="Only group admins can update member roles")

        # Check if target member exists
        target_member = next((m for m in group.get("members", []) if m["userId"] == member_id), None)
        if not target_member:
            raise HTTPException(status_code=404, detail="Member not found in group")

        # Prevent admins from demoting themselves if they are the only admin
        if member_id == user_id and new_role != "admin":
            admin_count = sum(1 for m in group.get("members", []) if m["role"] == "admin")
            if admin_count <= 1:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot demote yourself when you are the only admin. Promote another member to admin first."
                )

        result = await db.groups.update_one(
            {"_id": obj_id, "members.userId": member_id},
            {"$set": {"members.$.role": new_role}}
        )
        return result.modified_count == 1

    async def remove_member(self, group_id: str, member_id: str, user_id: str) -> bool:
        """Remove a member from group (admin only)"""
        db = self.get_db()
        try:
            obj_id = ObjectId(group_id)
        except Exception:
            return False

        # Check if group exists and user is admin
        group = await db.groups.find_one({
            "_id": obj_id,
            "members": {"$elemMatch": {"userId": user_id, "role": "admin"}}
        })
        if not group:
            # Check if group exists at all
            group_exists = await db.groups.find_one({"_id": obj_id})
            if not group_exists:
                raise HTTPException(status_code=404, detail="Group not found")
            else:
                raise HTTPException(status_code=403, detail="Only group admins can remove members")

        # Check if target member exists and is not the requesting user
        target_member = next((m for m in group.get("members", []) if m["userId"] == member_id), None)
        if not target_member:
            raise HTTPException(status_code=404, detail="Member not found in group")
        
        if member_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot remove yourself. Use leave group instead")

        # TODO: Check for outstanding balances with expense service
        # For now, we'll allow removal without balance check

        result = await db.groups.update_one(
            {"_id": obj_id},
            {"$pull": {"members": {"userId": member_id}}}
        )
        return result.modified_count == 1

group_service = GroupService()
