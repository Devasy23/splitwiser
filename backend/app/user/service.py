from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.database import get_database
from bson import ObjectId
from fastapi import Depends, HTTPException, status


class UserService:
    def __init__(self):
        pass

    def get_db(self):
        return get_database()

    def transform_user_document(self, user: dict) -> dict:
        if not user:
            return None

        def iso(dt):
            if not dt:
                return None
            if isinstance(dt, str):
                return dt
            # Normalize to UTC and append 'Z'
            try:
                dt_utc = (
                    dt.astimezone(timezone.utc)
                    if getattr(dt, "tzinfo", None)
                    else dt.replace(tzinfo=timezone.utc)
                )
                return dt_utc.isoformat().replace("+00:00", "Z")
            except AttributeError:
                return str(dt)

        try:
            user_id = str(user["_id"])
        except Exception:
            return None  # Handle invalid ObjectId gracefully
        return {
            "id": user_id,
            "name": user.get("name"),
            "email": user.get("email"),
            "imageUrl": user.get("imageUrl"),
            "currency": user.get("currency", "USD"),
            "createdAt": iso(user.get("created_at")),
            "updatedAt": iso(user.get("updated_at") or user.get("created_at")),
        }

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        db = self.get_db()
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            return None  # Handle invalid ObjectId gracefully
        user = await db.users.find_one({"_id": obj_id})
        return self.transform_user_document(user)

    async def update_user_profile(self, user_id: str, updates: dict) -> Optional[dict]:
        db = self.get_db()
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            return None  # Handle invalid ObjectId gracefully
        # Only allow certain fields
        allowed = {"name", "imageUrl", "currency"}
        updates = {k: v for k, v in updates.items() if k in allowed}
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await db.users.find_one_and_update(
            {"_id": obj_id}, {"$set": updates}, return_document=True
        )
        return self.transform_user_document(result)

    async def delete_user(self, user_id: str) -> bool:
        db = self.get_db()
        try:
            obj_id = ObjectId(user_id)
        except Exception:
            return False  # Handle invalid ObjectId gracefully
        result = await db.users.delete_one({"_id": obj_id})
        return result.deleted_count > 0


user_service = UserService()
