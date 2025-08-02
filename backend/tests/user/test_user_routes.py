from datetime import datetime, timedelta

import pytest
from app.auth.security import create_access_token
from fastapi import status
from fastapi.testclient import TestClient
from main import app

# Sample user data for testing
TEST_USER_ID = "60c72b2f9b1e8a3f9c8b4567"
TEST_USER_EMAIL = "testuser@example.com"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_headers():
    token = create_access_token(
        data={"sub": TEST_USER_EMAIL, "_id": TEST_USER_ID},
        expires_delta=timedelta(minutes=15),
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True, scope="function")
async def setup_test_user(mocker):
    iso_date = "2023-01-01T00:00:00Z"
    iso_date2 = "2023-01-02T00:00:00Z"
    iso_date3 = "2023-01-03T00:00:00Z"
    mocker.patch(
        "app.user.service.user_service.get_user_by_id",
        return_value={
            "id": TEST_USER_ID,
            "name": "Test User",
            "email": TEST_USER_EMAIL,
            "imageUrl": None,
            "currency": "USD",
            "createdAt": iso_date,
            "updatedAt": iso_date,
        },
    )
    mocker.patch(
        "app.user.service.user_service.update_user_profile",
        return_value={
            "id": TEST_USER_ID,
            "name": "Updated Test User",
            "email": TEST_USER_EMAIL,
            "imageUrl": "http://example.com/avatar.png",
            "currency": "EUR",
            "createdAt": iso_date,
            "updatedAt": iso_date2,
        },
    )
    mocker.patch("app.user.service.user_service.delete_user", return_value=True)
    yield


# --- Tests for GET /users/me ---


def test_get_current_user_profile_success(
    client: TestClient, auth_headers: dict, mocker
):
    """Test successful retrieval of current user's profile."""
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == TEST_USER_ID
    assert data["email"] == TEST_USER_EMAIL
    assert "name" in data
    assert "currency" in data
    assert "createdAt" in data and data["createdAt"].endswith("Z")
    assert "updatedAt" in data and data["updatedAt"].endswith("Z")


def test_get_current_user_profile_not_found(
    client: TestClient, auth_headers: dict, mocker
):
    """Test retrieval when user is not found in service layer."""
    mocker.patch("app.user.service.user_service.get_user_by_id", return_value=None)
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": {"error": "NotFound", "message": "User not found"}
    }


# --- Tests for PATCH /users/me ---


def test_update_user_profile_success(client: TestClient, auth_headers: dict, mocker):
    """Test successful update of user profile."""
    update_payload = {
        "name": "Updated Test User",
        "imageUrl": "http://example.com/avatar.png",
        "currency": "EUR",
    }
    response = client.patch("/users/me", headers=auth_headers, json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()["user"]
    assert data["name"] == "Updated Test User"
    assert data["imageUrl"] == "http://example.com/avatar.png"
    assert data["currency"] == "EUR"
    assert data["id"] == TEST_USER_ID
    assert "createdAt" in data and data["createdAt"].endswith("Z")
    assert "updatedAt" in data and data["updatedAt"].endswith("Z")


def test_update_user_profile_partial_update(
    client: TestClient, auth_headers: dict, mocker
):
    """Test updating only one field of the user profile."""
    iso_date = "2023-01-01T00:00:00Z"
    iso_date3 = "2023-01-03T00:00:00Z"
    update_payload = {"name": "Only Name Updated"}
    mocker.patch(
        "app.user.service.user_service.update_user_profile",
        return_value={
            "id": TEST_USER_ID,
            "name": "Only Name Updated",
            "email": TEST_USER_EMAIL,
            "imageUrl": None,
            "currency": "USD",
            "createdAt": iso_date,
            "updatedAt": iso_date3,
        },
    )
    response = client.patch("/users/me", headers=auth_headers, json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()["user"]
    assert data["name"] == "Only Name Updated"
    assert data["currency"] == "USD"
    assert data["id"] == TEST_USER_ID
    assert "createdAt" in data and data["createdAt"].endswith("Z")
    assert "updatedAt" in data and data["updatedAt"].endswith("Z")


def test_update_user_profile_no_fields(client: TestClient, auth_headers: dict):
    """Test updating profile with no fields, expecting a 400 error."""
    response = client.patch("/users/me", headers=auth_headers, json={})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {
        "detail": {"error": "InvalidInput", "message": "No update fields provided."}
    }


def test_update_user_profile_user_not_found(
    client: TestClient, auth_headers: dict, mocker
):
    """Test updating profile when user is not found by the service."""
    mocker.patch("app.user.service.user_service.update_user_profile", return_value=None)
    update_payload = {"name": "Attempted Update"}
    response = client.patch("/users/me", headers=auth_headers, json=update_payload)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": {"error": "NotFound", "message": "User not found"}
    }


# --- Tests for DELETE /users/me ---


def test_delete_user_account_success(client: TestClient, auth_headers: dict, mocker):
    """Test successful deletion of a user account."""
    response = client.delete("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "User account scheduled for deletion."


def test_delete_user_account_not_found(client: TestClient, auth_headers: dict, mocker):
    """Test deleting a user account when the user is not found by the service."""
    mocker.patch("app.user.service.user_service.delete_user", return_value=False)
    response = client.delete("/users/me", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": {"error": "NotFound", "message": "User not found"}
    }


# All route tests are in place, removing the placeholder
# def test_placeholder():
#     assert True
