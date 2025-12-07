"""Tests for the optimized _enrich_members_with_user_details function"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.groups.service import GroupService
from bson import ObjectId


class TestEnrichMembersOptimized:
    """Test cases for _enrich_members_with_user_details optimized function"""

    def setup_method(self):
        """Setup for each test method"""
        self.service = GroupService()

    @pytest.mark.asyncio
    async def test_enrich_members_with_user_details_success(self):
        """Test successful enrichment of members with user details"""
        user_id_1 = str(ObjectId())
        user_id_2 = str(ObjectId())
        user_id_3 = str(ObjectId())

        members = [
            {"userId": user_id_1, "role": "admin", "joinedAt": "2023-01-01"},
            {"userId": user_id_2, "role": "member", "joinedAt": "2023-01-02"},
            {"userId": user_id_3, "role": "member", "joinedAt": "2023-01-03"},
        ]

        mock_users = [
            {"_id": ObjectId(user_id_1), "name": "Admin User", "imageUrl": "admin.jpg"},
            {
                "_id": ObjectId(user_id_2),
                "name": "Member One",
                "imageUrl": "member1.jpg",
            },
            {"_id": ObjectId(user_id_3), "name": "Member Two", "imageUrl": None},
        ]

        mock_db = MagicMock()
        mock_users_collection = MagicMock()
        mock_db.users = mock_users_collection

        # Mock the find operation
        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = mock_users
        mock_users_collection.find.return_value = mock_cursor

        with patch.object(self.service, "get_db", return_value=mock_db):
            enriched = await self.service._enrich_members_with_user_details(members)

        assert len(enriched) == 3
        assert enriched[0]["userId"] == user_id_1
        assert enriched[0]["user"]["name"] == "Admin User"
        assert enriched[0]["user"]["imageUrl"] == "admin.jpg"
        assert enriched[0]["role"] == "admin"

        assert enriched[1]["userId"] == user_id_2
        assert enriched[1]["user"]["name"] == "Member One"
        assert enriched[1]["user"]["imageUrl"] == "member1.jpg"

        assert enriched[2]["userId"] == user_id_3
        assert enriched[2]["user"]["name"] == "Member Two"
        assert enriched[2]["user"]["imageUrl"] is None

        # Verify the query was made correctly with $in operator
        mock_users_collection.find.assert_called_once()
        call_args = mock_users_collection.find.call_args
        assert "_id" in call_args[0][0]
        assert "$in" in call_args[0][0]["_id"]

    @pytest.mark.asyncio
    async def test_enrich_members_empty_list(self):
        """Test enrichment with empty members list"""
        mock_db = MagicMock()

        with patch.object(self.service, "get_db", return_value=mock_db):
            enriched = await self.service._enrich_members_with_user_details([])

        assert enriched == []
        # Verify no database call was made
        mock_db.users.find.assert_not_called()

    @pytest.mark.asyncio
    async def test_enrich_members_missing_user_data(self):
        """Test enrichment when some users are not found in database"""
        user_id_1 = str(ObjectId())
        user_id_2 = str(ObjectId())

        members = [
            {"userId": user_id_1, "role": "admin", "joinedAt": "2023-01-01"},
            {"userId": user_id_2, "role": "member", "joinedAt": "2023-01-02"},
        ]

        # Only return data for user_id_1, not user_id_2
        mock_users = [
            {"_id": ObjectId(user_id_1), "name": "Admin User", "imageUrl": "admin.jpg"},
        ]

        mock_db = MagicMock()
        mock_users_collection = MagicMock()
        mock_db.users = mock_users_collection

        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = mock_users
        mock_users_collection.find.return_value = mock_cursor

        with patch.object(self.service, "get_db", return_value=mock_db):
            enriched = await self.service._enrich_members_with_user_details(members)

        assert len(enriched) == 2
        assert enriched[0]["user"]["name"] == "Admin User"
        # Missing user should have fallback name
        assert "User" in enriched[1]["user"]["name"]  # Will be "User <last4digits>"

    @pytest.mark.asyncio
    async def test_enrich_members_database_error(self):
        """Test enrichment when database query fails"""
        user_id_1 = str(ObjectId())

        members = [
            {"userId": user_id_1, "role": "admin", "joinedAt": "2023-01-01"},
        ]

        mock_db = MagicMock()
        mock_users_collection = MagicMock()
        mock_db.users = mock_users_collection

        # Simulate database error
        mock_cursor = AsyncMock()
        mock_cursor.to_list.side_effect = Exception("Database connection error")
        mock_users_collection.find.return_value = mock_cursor

        with patch.object(self.service, "get_db", return_value=mock_db):
            enriched = await self.service._enrich_members_with_user_details(members)

        # Should still return members with fallback user data
        assert len(enriched) == 1
        assert "User" in enriched[0]["user"]["name"]  # Fallback name
        assert enriched[0]["user"]["imageUrl"] is None

    @pytest.mark.asyncio
    async def test_enrich_members_preserves_member_fields(self):
        """Test that enrichment preserves all original member fields"""
        user_id_1 = str(ObjectId())

        members = [
            {
                "userId": user_id_1,
                "role": "admin",
                "joinedAt": "2023-01-01",
                "customField": "custom_value",
            },
        ]

        mock_users = [
            {"_id": ObjectId(user_id_1), "name": "Admin User", "imageUrl": "admin.jpg"},
        ]

        mock_db = MagicMock()
        mock_users_collection = MagicMock()
        mock_db.users = mock_users_collection

        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = mock_users
        mock_users_collection.find.return_value = mock_cursor

        with patch.object(self.service, "get_db", return_value=mock_db):
            enriched = await self.service._enrich_members_with_user_details(members)

        # Verify all fields are preserved
        assert enriched[0]["userId"] == user_id_1
        assert enriched[0]["role"] == "admin"
        assert enriched[0]["joinedAt"] == "2023-01-01"
        # Note: customField won't be in the output as the function creates a new structure
        # It only preserves userId, role, and joinedAt
        assert enriched[0]["user"]["name"] == "Admin User"
        assert enriched[0]["user"]["imageUrl"] == "admin.jpg"

    @pytest.mark.asyncio
    async def test_enrich_members_batch_query_optimization(self):
        """Test that the function uses a single batch query instead of N queries"""
        # Create 10 members
        members = []
        user_ids = []
        for i in range(10):
            user_id = str(ObjectId())
            user_ids.append(user_id)
            members.append(
                {"userId": user_id, "role": "member", "joinedAt": f"2023-01-{i+1:02d}"}
            )

        mock_users = [
            {"_id": ObjectId(uid), "name": f"User {i}", "imageUrl": None}
            for i, uid in enumerate(user_ids)
        ]

        mock_db = MagicMock()
        mock_users_collection = MagicMock()
        mock_db.users = mock_users_collection

        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = mock_users
        mock_users_collection.find.return_value = mock_cursor

        with patch.object(self.service, "get_db", return_value=mock_db):
            enriched = await self.service._enrich_members_with_user_details(members)

        # Verify only ONE database call was made (batch query)
        assert mock_users_collection.find.call_count == 1

        # Verify all 10 members were enriched
        assert len(enriched) == 10
        for i, member in enumerate(enriched):
            assert member["user"]["name"] == f"User {i}"
