import pytest
from app.user.service import UserService
from app.database import get_database # To mock the database dependency
from bson import ObjectId
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock # For mocking async methods and db client

# Initialize UserService instance for testing
user_service = UserService()

# --- Fixtures ---

@pytest.fixture
def mock_db_client():
    """Fixture to create a mock database client with an async users collection."""
    db_client = MagicMock()
    db_client.users = AsyncMock() # Mock the 'users' collection
    return db_client

@pytest.fixture(autouse=True)
def mock_get_database(mocker, mock_db_client):
    """Autouse fixture to mock get_database and return the mock_db_client."""
    return mocker.patch("app.user.service.get_database", return_value=mock_db_client)


# --- Test Data ---

TEST_OBJECT_ID_STR = "60c72b2f9b1e8a3f9c8b4567"
TEST_OBJECT_ID = ObjectId(TEST_OBJECT_ID_STR)
NOW = datetime.now(timezone.utc)

RAW_USER_FROM_DB = {
    "_id": TEST_OBJECT_ID,
    "name": "Test User",
    "email": "test@example.com",
    "avatar": "http://example.com/avatar.jpg",
    "currency": "EUR",
    "created_at": NOW,
    "updated_at": NOW,
}

TRANSFORMED_USER_EXPECTED = {
    "_id": TEST_OBJECT_ID_STR,
    "name": "Test User",
    "email": "test@example.com",
    "avatar": "http://example.com/avatar.jpg",
    "currency": "EUR",
    "createdAt": NOW,
    "updatedAt": NOW,
}

# --- Tests for transform_user_document ---

def test_transform_user_document_all_fields():
    transformed = user_service.transform_user_document(RAW_USER_FROM_DB)
    assert transformed == TRANSFORMED_USER_EXPECTED

def test_transform_user_document_missing_optional_fields():
    raw_user_minimal = {
        "_id": TEST_OBJECT_ID,
        "name": "Minimal User",
        "email": "minimal@example.com",
        "created_at": NOW,
    }
    expected_transformed_minimal = {
        "_id": TEST_OBJECT_ID_STR,
        "name": "Minimal User",
        "email": "minimal@example.com",
        "avatar": None, # Expect None if not present
        "currency": "USD", # Expect default if not present
        "createdAt": NOW,
        "updatedAt": NOW, # Expect createdAt if updatedAt not present
    }
    transformed = user_service.transform_user_document(raw_user_minimal)
    assert transformed == expected_transformed_minimal

def test_transform_user_document_with_updated_at_different_from_created_at():
    later_time = datetime.now(timezone.utc)
    raw_user_updated = {
        "_id": TEST_OBJECT_ID,
        "name": "Updated User",
        "email": "updated@example.com",
        "created_at": NOW,
        "updated_at": later_time
    }
    expected_transformed_updated = {
        "_id": TEST_OBJECT_ID_STR,
        "name": "Updated User",
        "email": "updated@example.com",
        "avatar": None,
        "currency": "USD",
        "createdAt": NOW,
        "updatedAt": later_time,
    }
    transformed = user_service.transform_user_document(raw_user_updated)
    assert transformed == expected_transformed_updated

def test_transform_user_document_none_input():
    assert user_service.transform_user_document(None) is None

# --- Tests for get_user_by_id ---

@pytest.mark.asyncio
async def test_get_user_by_id_found(mock_db_client, mock_get_database):
    mock_db_client.users.find_one.return_value = RAW_USER_FROM_DB

    user = await user_service.get_user_by_id(TEST_OBJECT_ID_STR)

    mock_db_client.users.find_one.assert_called_once_with({"_id": TEST_OBJECT_ID})
    assert user == TRANSFORMED_USER_EXPECTED

@pytest.mark.asyncio
async def test_get_user_by_id_not_found(mock_db_client, mock_get_database):
    mock_db_client.users.find_one.return_value = None

    user = await user_service.get_user_by_id(TEST_OBJECT_ID_STR)

    mock_db_client.users.find_one.assert_called_once_with({"_id": TEST_OBJECT_ID})
    assert user is None

# --- Tests for update_user_profile ---

@pytest.mark.asyncio
async def test_update_user_profile_success(mock_db_client, mock_get_database):
    update_data = {"name": "New Name", "currency": "CAD"}

    # The user document that find_one_and_update would return
    updated_user_doc_from_db = RAW_USER_FROM_DB.copy()
    updated_user_doc_from_db.update(update_data)
    # updated_at will be set by the service method, so we don't put it in update_data
    # but the mock return value should reflect it.
    # For simplicity, we'll check its existence rather than exact value in this mock.

    mock_db_client.users.find_one_and_update.return_value = updated_user_doc_from_db

    # Expected transformed output
    expected_transformed = user_service.transform_user_document(updated_user_doc_from_db)

    updated_user = await user_service.update_user_profile(TEST_OBJECT_ID_STR, update_data)

    args, kwargs = mock_db_client.users.find_one_and_update.call_args
    assert args[0] == {"_id": TEST_OBJECT_ID}
    assert "$set" in args[1]
    assert args[1]["$set"]["name"] == "New Name"
    assert args[1]["$set"]["currency"] == "CAD"
    assert "updated_at" in args[1]["$set"] # Check that updated_at was added
    assert kwargs["return_document"] is True # from pymongo import ReturnDocument (True means ReturnDocument.AFTER)

    assert updated_user is not None
    assert updated_user["name"] == "New Name"
    assert updated_user["currency"] == "CAD"
    assert updated_user["_id"] == TEST_OBJECT_ID_STR
    # Ensure 'updated_at' in the result is more recent or equal to original if not updated by mock
    assert updated_user["updatedAt"] >= TRANSFORMED_USER_EXPECTED["updatedAt"]


@pytest.mark.asyncio
async def test_update_user_profile_user_not_found(mock_db_client, mock_get_database):
    mock_db_client.users.find_one_and_update.return_value = None # Simulate user not found
    update_data = {"name": "New Name"}
    NON_EXISTENT_VALID_OID = "123456789012345678901234"

    updated_user = await user_service.update_user_profile(NON_EXISTENT_VALID_OID, update_data)

    args, kwargs = mock_db_client.users.find_one_and_update.call_args
    assert args[0] == {"_id": ObjectId(NON_EXISTENT_VALID_OID)}
    assert "$set" in args[1]
    assert args[1]["$set"]["name"] == "New Name"
    assert "updated_at" in args[1]["$set"]
    assert kwargs["return_document"] is True
    assert updated_user is None

# --- Tests for delete_user ---

@pytest.mark.asyncio
async def test_delete_user_success(mock_db_client, mock_get_database):
    mock_delete_result = MagicMock()
    mock_delete_result.deleted_count = 1
    mock_db_client.users.delete_one.return_value = mock_delete_result

    result = await user_service.delete_user(TEST_OBJECT_ID_STR)

    mock_db_client.users.delete_one.assert_called_once_with({"_id": TEST_OBJECT_ID})
    assert result is True

@pytest.mark.asyncio
async def test_delete_user_not_found(mock_db_client, mock_get_database):
    mock_delete_result = MagicMock()
    mock_delete_result.deleted_count = 0
    mock_db_client.users.delete_one.return_value = mock_delete_result

    result = await user_service.delete_user(TEST_OBJECT_ID_STR)

    mock_db_client.users.delete_one.assert_called_once_with({"_id": TEST_OBJECT_ID})
    assert result is False
