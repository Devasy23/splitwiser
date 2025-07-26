from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from app.auth.security import create_access_token
from fastapi import status
from httpx import ASGITransport, AsyncClient
from main import app

# Sample user data for testing
TEST_USER_ID = "60c72b2f9b1e8a3f9c8b4567"
TEST_USER_EMAIL = "testuser@example.com"


@pytest.fixture
def auth_headers():
    token = create_access_token(
        data={"sub": TEST_USER_EMAIL, "_id": TEST_USER_ID},
        expires_delta=timedelta(minutes=15),
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


class TestGroupsRoutes:
    """Test cases for Groups API endpoints"""

    @pytest.mark.asyncio
    async def test_create_group_success(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test successful group creation"""
        group_data = {"name": "Test Group", "currency": "USD"}

        with patch("app.groups.service.group_service.create_group") as mock_create:
            mock_create.return_value = {
                "_id": "642f1e4a9b3c2d1f6a1b2c3d",
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

            response = await async_client.post(
                "/groups", json=group_data, headers=auth_headers
            )

            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            assert data["name"] == "Test Group"
            assert data["currency"] == "USD"
            assert "joinCode" in data

    @pytest.mark.asyncio
    async def test_create_group_empty_name(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test group creation with empty name"""
        group_data = {"name": "", "currency": "USD"}

        response = await async_client.post(
            "/groups", json=group_data, headers=auth_headers
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_list_user_groups(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test listing user groups"""
        with patch("app.groups.service.group_service.get_user_groups") as mock_get:
            mock_get.return_value = [
                {
                    "_id": "642f1e4a9b3c2d1f6a1b2c3d",
                    "name": "Test Group",
                    "currency": "USD",
                    "joinCode": "ABC123",
                    "createdBy": "user123",
                    "createdAt": "2023-01-01T00:00:00Z",
                    "imageUrl": None,
                    "members": [],
                }
            ]

            response = await async_client.get("/groups", headers=auth_headers)

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "groups" in data
            assert len(data["groups"]) == 1

    @pytest.mark.asyncio
    async def test_get_group_details(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test getting group details"""
        group_id = "642f1e4a9b3c2d1f6a1b2c3d"

        with patch("app.groups.service.group_service.get_group_by_id") as mock_get:
            mock_get.return_value = {
                "_id": group_id,
                "name": "Test Group",
                "currency": "USD",
                "joinCode": "ABC123",
                "createdBy": "user123",
                "createdAt": "2023-01-01T00:00:00Z",
                "imageUrl": None,
                "members": [],
            }

            response = await async_client.get(
                f"/groups/{group_id}", headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["_id"] == group_id

    @pytest.mark.asyncio
    async def test_get_group_not_found(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test getting non-existent group"""
        group_id = "642f1e4a9b3c2d1f6a1b2c3d"

        with patch("app.groups.service.group_service.get_group_by_id") as mock_get:
            mock_get.return_value = None

            response = await async_client.get(
                f"/groups/{group_id}", headers=auth_headers
            )

            assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_update_group_metadata(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test updating group metadata"""
        group_id = "642f1e4a9b3c2d1f6a1b2c3d"
        update_data = {"name": "Updated Group Name"}

        with patch("app.groups.service.group_service.update_group") as mock_update:
            mock_update.return_value = {
                "_id": group_id,
                "name": "Updated Group Name",
                "currency": "USD",
                "joinCode": "ABC123",
                "createdBy": "user123",
                "createdAt": "2023-01-01T00:00:00Z",
                "imageUrl": None,
                "members": [],
            }

            response = await async_client.patch(
                f"/groups/{group_id}", json=update_data, headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["name"] == "Updated Group Name"

    @pytest.mark.asyncio
    async def test_delete_group(self, async_client: AsyncClient, auth_headers, mock_db):
        """Test deleting a group"""
        group_id = "642f1e4a9b3c2d1f6a1b2c3d"

        with patch("app.groups.service.group_service.delete_group") as mock_delete:
            mock_delete.return_value = True

            response = await async_client.delete(
                f"/groups/{group_id}", headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True

    @pytest.mark.asyncio
    async def test_join_group_by_code(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test joining a group by code"""
        join_data = {"joinCode": "ABC123"}

        with patch("app.groups.service.group_service.join_group_by_code") as mock_join:
            mock_join.return_value = {
                "_id": "642f1e4a9b3c2d1f6a1b2c3d",
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
                    },
                    {
                        "userId": "user456",
                        "role": "member",
                        "joinedAt": "2023-01-01T00:00:00Z",
                    },
                ],
            }

            response = await async_client.post(
                "/groups/join", json=join_data, headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "group" in data

    @pytest.mark.asyncio
    async def test_leave_group(self, async_client: AsyncClient, auth_headers, mock_db):
        """Test leaving a group"""
        group_id = "642f1e4a9b3c2d1f6a1b2c3d"

        with patch("app.groups.service.group_service.leave_group") as mock_leave:
            mock_leave.return_value = True

            response = await async_client.post(
                f"/groups/{group_id}/leave", headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True

    @pytest.mark.asyncio
    async def test_get_group_members(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test getting group members"""
        group_id = "642f1e4a9b3c2d1f6a1b2c3d"

        with patch(
            "app.groups.service.group_service.get_group_members"
        ) as mock_get_members:
            mock_get_members.return_value = [
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
            ]

            response = await async_client.get(
                f"/groups/{group_id}/members", headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert len(data) == 2

    @pytest.mark.asyncio
    async def test_update_member_role(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test updating member role"""
        group_id = "642f1e4a9b3c2d1f6a1b2c3d"
        member_id = "user456"
        role_data = {"role": "admin"}

        with patch(
            "app.groups.service.group_service.update_member_role"
        ) as mock_update_role:
            mock_update_role.return_value = True

            response = await async_client.patch(
                f"/groups/{group_id}/members/{member_id}",
                json=role_data,
                headers=auth_headers,
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "message" in data

    @pytest.mark.asyncio
    async def test_remove_member(
        self, async_client: AsyncClient, auth_headers, mock_db
    ):
        """Test removing a member from group"""
        group_id = "642f1e4a9b3c2d1f6a1b2c3d"
        member_id = "user456"

        with patch("app.groups.service.group_service.remove_member") as mock_remove:
            mock_remove.return_value = True

            response = await async_client.delete(
                f"/groups/{group_id}/members/{member_id}", headers=auth_headers
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
