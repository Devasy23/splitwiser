import pytest
from fastapi.testclient import TestClient # Changed from httpx import AsyncClient
from fastapi import status
from main import app  # Corrected: Assuming your FastAPI app instance is named 'app' in main.py
from app.auth.security import create_access_token # Helper to create tokens for testing
from datetime import datetime, timedelta # Added datetime

# Sample user data for testing
TEST_USER_ID = "60c72b2f9b1e8a3f9c8b4567" # Example ObjectId string
TEST_USER_EMAIL = "testuser@example.com"

@pytest.fixture(scope="module")
def client(): # Changed to synchronous fixture
    with TestClient(app) as c: # Changed to TestClient
        yield c

@pytest.fixture(scope="module")
def auth_headers():
    token = create_access_token(
        data={"sub": TEST_USER_EMAIL, "_id": TEST_USER_ID},
        expires_delta=timedelta(minutes=15)
    )
    return {"Authorization": f"Bearer {token}"}

# Placeholder for database setup/teardown if needed, e.g., creating a test user
@pytest.fixture(autouse=True, scope="function")
async def setup_test_user(mocker):
    # Mock the user service to avoid actual database calls initially
    # This allows focusing on route logic.
    # More specific mocks will be needed per test.
    mocker.patch("app.user.service.user_service.get_user_by_id", return_value={
        "_id": TEST_USER_ID,
        "name": "Test User",
        "email": TEST_USER_EMAIL,
        "avatar": None,
        "currency": "USD",
        "createdAt": datetime.fromisoformat("2023-01-01T00:00:00"), # Changed to camelCase
        "updatedAt": datetime.fromisoformat("2023-01-01T00:00:00")  # Changed to camelCase
    })
    mocker.patch("app.user.service.user_service.update_user_profile", return_value={
        "_id": TEST_USER_ID,
        "name": "Updated Test User",
        "email": TEST_USER_EMAIL,
        "avatar": "http://example.com/avatar.png",
        "currency": "EUR",
        "createdAt": datetime.fromisoformat("2023-01-01T00:00:00"), # Changed to camelCase
        "updatedAt": datetime.fromisoformat("2023-01-02T00:00:00")  # Changed to camelCase
    })
    mocker.patch("app.user.service.user_service.delete_user", return_value=True)

    # If you have a real test database, you'd create a user here.
    # For now, we rely on mocking the service layer.
    # Example:
    # from app.database import get_database
    # db = get_database()
    # await db.users.insert_one({
    #     "_id": ObjectId(TEST_USER_ID),
    #     "email": TEST_USER_EMAIL,
    #     "name": "Test User",
    #     "hashed_password": "fakehashedpassword", # Add other necessary fields
    #     "created_at": datetime.utcnow(),
    #     "updated_at": datetime.utcnow()
    # })
    yield
    # Teardown: remove the test user
    # Example:
    # await db.users.delete_one({"_id": ObjectId(TEST_USER_ID)})

# --- Tests for GET /users/me ---

def test_get_current_user_profile_success(client: TestClient, auth_headers: dict, mocker): # Changed AsyncClient, removed async
    """Test successful retrieval of current user's profile."""
    # The setup_test_user fixture already mocks get_user_by_id
    response = client.get("/users/me", headers=auth_headers) # removed await
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["_id"] == TEST_USER_ID
    assert data["email"] == TEST_USER_EMAIL
    assert "name" in data
    assert "currency" in data

def test_get_current_user_profile_not_found(client: TestClient, auth_headers: dict, mocker): # Changed AsyncClient, removed async
    """Test retrieval when user is not found in service layer."""
    mocker.patch("app.user.service.user_service.get_user_by_id", return_value=None)

    response = client.get("/users/me", headers=auth_headers) # removed await
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "User not found"}

# --- Tests for PATCH /users/me ---

def test_update_user_profile_success(client: TestClient, auth_headers: dict, mocker): # Changed AsyncClient, removed async
    """Test successful update of user profile."""
    update_payload = {
        "name": "Updated Test User",
        "imageUrl": "http://example.com/avatar.png",
        "currency": "EUR"
    }
    # The setup_test_user fixture already mocks update_user_profile
    response = client.patch("/users/me", headers=auth_headers, json=update_payload) # removed await
    assert response.status_code == status.HTTP_200_OK
    data = response.json()["user"] # Response is {"user": updated_user_data}
    assert data["name"] == "Updated Test User"
    assert data["avatar"] == "http://example.com/avatar.png" # Note: schema uses imageUrl, service uses avatar
    assert data["currency"] == "EUR"
    assert data["_id"] == TEST_USER_ID

def test_update_user_profile_partial_update(client: TestClient, auth_headers: dict, mocker): # Changed AsyncClient, removed async
    """Test updating only one field of the user profile."""
    update_payload = {"name": "Only Name Updated"}

    # Specific mock for this test case if needed, or ensure global mock handles partials
    mocker.patch("app.user.service.user_service.update_user_profile", return_value={
        "_id": TEST_USER_ID, "name": "Only Name Updated", "email": TEST_USER_EMAIL,
        "avatar": None, "currency": "USD", # Assuming other fields remain unchanged
        "createdAt": datetime.fromisoformat("2023-01-01T00:00:00"), # Changed to camelCase and datetime
        "updatedAt": datetime.fromisoformat("2023-01-03T00:00:00")  # Changed to camelCase and datetime
    })

    response = client.patch("/users/me", headers=auth_headers, json=update_payload) # removed await
    assert response.status_code == status.HTTP_200_OK
    data = response.json()["user"]
    assert data["name"] == "Only Name Updated"
    assert data["currency"] == "USD" # Assuming currency wasn't updated

def test_update_user_profile_no_fields(client: TestClient, auth_headers: dict): # Changed AsyncClient, removed async
    """Test updating profile with no fields, expecting a 400 error."""
    response = client.patch("/users/me", headers=auth_headers, json={}) # removed await
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {"detail": "No update fields provided."}

def test_update_user_profile_user_not_found(client: TestClient, auth_headers: dict, mocker): # Changed AsyncClient, removed async
    """Test updating profile when user is not found by the service."""
    mocker.patch("app.user.service.user_service.update_user_profile", return_value=None)
    update_payload = {"name": "Attempted Update"}
    response = client.patch("/users/me", headers=auth_headers, json=update_payload) # removed await
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "User not found"}

# --- Tests for DELETE /users/me ---

def test_delete_user_account_success(client: TestClient, auth_headers: dict, mocker): # Changed AsyncClient, removed async
    """Test successful deletion of a user account."""
    # The setup_test_user fixture already mocks delete_user to return True
    response = client.delete("/users/me", headers=auth_headers) # removed await
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "User account scheduled for deletion."

def test_delete_user_account_not_found(client: TestClient, auth_headers: dict, mocker): # Changed AsyncClient, removed async
    """Test deleting a user account when the user is not found by the service."""
    mocker.patch("app.user.service.user_service.delete_user", return_value=False)
    response = client.delete("/users/me", headers=auth_headers) # removed await
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "User not found"}

# All route tests are in place, removing the placeholder
# def test_placeholder():
#     assert True
