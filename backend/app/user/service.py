from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.config import logger
from app.services.base import BaseService
from bson import ObjectId, errors


class UserService(BaseService):
    def __init__(self):
        super().__init__("users")

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
                logger.warning(
                    "DateTime conversion failed, returning raw string"
                )  # Logging failed datetime transformation
                return str(dt)

        user_id = str(user.get("id") or user.get("_id"))
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
        user = await self.get_by_id(user_id)
        return self.transform_user_document(user)

    async def update_user_profile(self, user_id: str, updates: dict) -> Optional[dict]:
        try:
            obj_id = ObjectId(user_id)
        except errors.InvalidId as e:
            logger.warning(f"Invalid User ID format: {e}")
            return None
        # Only allow certain fields
        allowed = {"name", "imageUrl", "currency"}
        updates = {k: v for k, v in updates.items() if k in allowed}
        updates["updated_at"] = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"_id": obj_id}, {"$set": updates}, return_document=True
        )
        return self.transform_user_document(result)

    async def delete_user(self, user_id: str) -> bool:
        return await self.delete(user_id)
