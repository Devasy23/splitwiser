from typing import Any, Dict, Optional

from app.database import get_database
from bson import ObjectId, errors


class BaseService:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.db = get_database()
        self.collection = self.db[self.collection_name]

    def _to_json(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Converts a MongoDB document to a JSON-serializable dictionary."""
        if item and "_id" in item:
            item["id"] = str(item.pop("_id"))
        return item

    async def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        try:
            obj_id = ObjectId(item_id)
        except errors.InvalidId:
            return None
        item = await self.collection.find_one({"_id": obj_id})
        return self._to_json(item)

    async def delete(self, item_id: str) -> bool:
        try:
            obj_id = ObjectId(item_id)
        except errors.InvalidId:
            return False
        result = await self.collection.delete_one({"_id": obj_id})
        return result.deleted_count > 0
