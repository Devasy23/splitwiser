from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.groups.service import GroupService
from bson import ObjectId
from fastapi import HTTPException


class TestGroupService:
    """Test cases for GroupService"""

    def setup_method(self):
        """Setup for each test method"""
        self.service = GroupService()

    def test_generate_join_code(self):
        """Test join code generation"""
        code = self.service.generate_join_code()
        assert len(code) == 6
        assert code.isalnum()
        assert code.isupper()

    def test_transform_group_document(self):
        """Test group document transformation"""
        group_doc = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "currency": "USD",
            "joinCode": "ABC123",
            "createdBy": "user123",
            "createdAt": "2023-01-01T00:00:00Z",
            "imageUrl": None,
            "members": [],
        }

        result = self.service.transform_group_document(group_doc)

        assert result["_id"] == "642f1e4a9b3c2d1f6a1b2c3d"
        assert result["name"] == "Test Group"
        assert result["currency"] == "USD"
        assert result["joinCode"] == "ABC123"

    def test_transform_group_document_none(self):
        """Test transform with None input"""
        result = self.service.transform_group_document(None)
        assert result is None

    @pytest.mark.asyncio
    async def test_create_group_success(self):
        """Test successful group creation"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        # Mock find_one to return None (no existing join code)
        mock_collection.find_one.return_value = None

        # Mock insert_one
        mock_result = MagicMock()
        mock_result.inserted_id = ObjectId("642f1e4a9b3c2d1f6a1b2c3d")
        mock_collection.insert_one.return_value = mock_result

        # Mock find_one for created group
        created_group = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "currency": "USD",
            "joinCode": "ABC123",
            "createdBy": "user123",
            "createdAt": "2023-01-01T00:00:00Z",
            "imageUrl": None,
            "members": [
                {
                    "userId": "user123",
                    "role": "admin",
                    "joinedAt": "2023-01-01T00:00:00Z",
                }
            ],
        }
        mock_collection.find_one.side_effect = [None, created_group]

        with patch.object(self.service, "get_db", return_value=mock_db):
            result = await self.service.create_group(
                {"name": "Test Group", "currency": "USD"}, "user123"
            )

        assert result["name"] == "Test Group"
        assert result["currency"] == "USD"
        assert "joinCode" in result

    @pytest.mark.asyncio
    async def test_get_user_groups(self):
        """Test getting user groups"""
        mock_db = MagicMock()  # Use MagicMock instead of AsyncMock
        mock_collection = MagicMock()  # Use MagicMock instead of AsyncMock
        mock_db.groups = mock_collection

        # Mock groups data
        mock_groups = [
            {
                "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
                "name": "Test Group",
                "currency": "USD",
                "joinCode": "ABC123",
                "createdBy": "user123",
                "createdAt": "2023-01-01T00:00:00Z",
                "imageUrl": None,
                "members": [],
            }
        ]

        # Create a proper async iterator mock
        async def mock_async_iter():
            for group in mock_groups:
                yield group

        # Mock cursor with proper __aiter__ method
        mock_cursor = MagicMock()
        mock_cursor.__aiter__ = lambda self: mock_async_iter()
        mock_collection.find.return_value = mock_cursor

        with patch.object(self.service, "get_db", return_value=mock_db):
            result = await self.service.get_user_groups("user123")

        assert len(result) == 1
        assert result[0]["name"] == "Test Group"

    @pytest.mark.asyncio
    async def test_join_group_by_code_success(self):
        """Test successful group joining"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        existing_group = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "joinCode": "ABC123",
            "members": [
                {
                    "userId": "user123",
                    "role": "admin",
                    "joinedAt": "2023-01-01T00:00:00Z",
                }
            ],
        }

        updated_group = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "joinCode": "ABC123",
            "members": [
                {
                    "userId": "user123",
                    "role": "admin",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
                {
                    "userId": "user456",
                    "role": "member",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
            ],
        }

        mock_collection.find_one.return_value = existing_group
        mock_collection.find_one_and_update.return_value = updated_group

        with patch.object(self.service, "get_db", return_value=mock_db):
            result = await self.service.join_group_by_code("ABC123", "user456")

        assert result is not None
        assert len(result["members"]) == 2

    @pytest.mark.asyncio
    async def test_join_group_invalid_code(self):
        """Test joining group with invalid code"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        mock_collection.find_one.return_value = None

        with patch.object(self.service, "get_db", return_value=mock_db):
            with pytest.raises(HTTPException) as exc_info:
                await self.service.join_group_by_code("INVALID", "user456")

            assert exc_info.value.status_code == 404
            assert "Invalid join code" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_join_group_already_member(self):
        """Test joining group when already a member"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        existing_group = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "joinCode": "ABC123",
            "members": [
                {
                    "userId": "user456",
                    "role": "member",
                    "joinedAt": "2023-01-01T00:00:00Z",
                }
            ],
        }

        mock_collection.find_one.return_value = existing_group

        with patch.object(self.service, "get_db", return_value=mock_db):
            with pytest.raises(HTTPException) as exc_info:
                await self.service.join_group_by_code("ABC123", "user456")

            assert exc_info.value.status_code == 400
            assert "already a member" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_group_not_admin(self):
        """Test updating group when not admin"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        mock_collection.find_one.return_value = None  # User not admin

        with patch.object(self.service, "get_db", return_value=mock_db):
            with pytest.raises(HTTPException) as exc_info:
                await self.service.update_group(
                    "642f1e4a9b3c2d1f6a1b2c3d", {"name": "New Name"}, "user456"
                )

            assert exc_info.value.status_code == 403
            assert "Only group admins" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_member_role_prevent_last_admin_demotion(self):
        """Test preventing the last admin from demoting themselves"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        # Mock group with only one admin
        group_with_one_admin = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "members": [
                {
                    "userId": "user123",
                    "role": "admin",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
                {
                    "userId": "user456",
                    "role": "member",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
            ],
        }

        mock_collection.find_one.return_value = group_with_one_admin

        with patch.object(self.service, "get_db", return_value=mock_db):
            with pytest.raises(HTTPException) as exc_info:
                await self.service.update_member_role(
                    "642f1e4a9b3c2d1f6a1b2c3d", "user123", "member", "user123"
                )

            assert exc_info.value.status_code == 400
            assert "Cannot demote yourself when you are the only admin" in str(
                exc_info.value.detail
            )

    @pytest.mark.asyncio
    async def test_update_member_role_allow_admin_demotion_with_other_admins(self):
        """Test allowing admin demotion when there are other admins"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        # Mock group with multiple admins
        group_with_multiple_admins = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "members": [
                {
                    "userId": "user123",
                    "role": "admin",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
                {
                    "userId": "user456",
                    "role": "admin",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
                {
                    "userId": "user789",
                    "role": "member",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
            ],
        }

        mock_collection.find_one.return_value = group_with_multiple_admins
        mock_result = MagicMock()
        mock_result.modified_count = 1
        mock_collection.update_one.return_value = mock_result

        with patch.object(self.service, "get_db", return_value=mock_db):
            result = await self.service.update_member_role(
                "642f1e4a9b3c2d1f6a1b2c3d", "user123", "member", "user123"
            )

            assert result is True

    @pytest.mark.asyncio
    async def test_remove_member_group_not_found(self):
        """Test removing member from non-existent group"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        # Mock no group found for admin check and no group exists at all
        mock_collection.find_one.side_effect = [None, None]

        with patch.object(self.service, "get_db", return_value=mock_db):
            with pytest.raises(HTTPException) as exc_info:
                await self.service.remove_member(
                    "642f1e4a9b3c2d1f6a1b2c3d", "user456", "user123"
                )

            assert exc_info.value.status_code == 404
            assert "Group not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_remove_member_user_not_admin_but_group_exists(self):
        """Test removing member when user is not admin but group exists"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        existing_group = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "members": [
                {
                    "userId": "user123",
                    "role": "admin",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
                {
                    "userId": "user456",
                    "role": "member",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
            ],
        }

        # First call returns None (user not admin), second call returns the group (group exists)
        mock_collection.find_one.side_effect = [None, existing_group]

        with patch.object(self.service, "get_db", return_value=mock_db):
            with pytest.raises(HTTPException) as exc_info:
                await self.service.remove_member(
                    "642f1e4a9b3c2d1f6a1b2c3d", "user456", "user789"
                )  # user789 is not admin

            assert exc_info.value.status_code == 403
            assert "Only group admins can remove members" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_leave_group_prevent_last_admin(self):
        """Test preventing the last admin from leaving the group"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        # Mock group with only one admin
        group_with_one_admin = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "members": [
                {
                    "userId": "user123",
                    "role": "admin",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
                {
                    "userId": "user456",
                    "role": "member",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
            ],
        }

        mock_collection.find_one.return_value = group_with_one_admin

        with patch.object(self.service, "get_db", return_value=mock_db):
            with pytest.raises(HTTPException) as exc_info:
                await self.service.leave_group("642f1e4a9b3c2d1f6a1b2c3d", "user123")

            assert exc_info.value.status_code == 400
            assert "Cannot leave group when you are the only admin" in str(
                exc_info.value.detail
            )

    @pytest.mark.asyncio
    async def test_leave_group_allow_member_to_leave(self):
        """Test allowing regular members to leave"""
        mock_db = AsyncMock()
        mock_collection = AsyncMock()
        mock_db.groups = mock_collection

        group = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Test Group",
            "members": [
                {
                    "userId": "user123",
                    "role": "admin",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
                {
                    "userId": "user456",
                    "role": "member",
                    "joinedAt": "2023-01-01T00:00:00Z",
                },
            ],
        }

        mock_collection.find_one.return_value = group
        mock_result = MagicMock()
        mock_result.modified_count = 1
        mock_collection.update_one.return_value = mock_result

        with patch.object(self.service, "get_db", return_value=mock_db):
            result = await self.service.leave_group(
                "642f1e4a9b3c2d1f6a1b2c3d", "user456"
            )

            assert result is True

    # Adding invalid object ID and partial input tests for modified exception handling
    @pytest.mark.asyncio
    async def test_get_group_by_id_invalid_objectid(self):
        """Test get_group_by_id with invalid ObjectId format"""
        with patch.object(self.service, "get_db"):
            result = await self.service.get_group_by_id("invalid-id", "user123")
            assert result is None

    @pytest.mark.asyncio
    async def test_update_group_invalid_objectid(self):
        """Test update_group with invalid ObjectId"""
        with patch.object(self.service, "get_db"):
            result = await self.service.update_group(
                "invalid-id", {"name": "test"}, "user123"
            )
            assert result is None

    @pytest.mark.asyncio
    async def test_delete_group_invalid_objectid(self):
        """Test delete_group with invalid ObjectId"""
        with patch.object(self.service, "get_db"):
            result = await self.service.delete_group("invalid-id", "user123")
            assert result is False

    def test_transform_group_document_partial_input(self):
        """Test transform with partial group fields"""
        group_doc = {
            "_id": ObjectId("642f1e4a9b3c2d1f6a1b2c3d"),
            "name": "Partial Group",
        }

        result = self.service.transform_group_document(group_doc)
        assert result["name"] == "Partial Group"
        assert result["currency"] == "USD"  # default fallback
        assert result["members"] == []  # default fallback
