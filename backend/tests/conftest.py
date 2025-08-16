import os  # Added
import sys  # Added
from pathlib import Path  # Added
from unittest.mock import MagicMock, patch

import firebase_admin  # Added
import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient

# Add project root to sys.path to allow imports from app and main
# This assumes conftest.py is in backend/tests/
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))


@pytest.fixture(scope="session", autouse=True)
def mock_firebase_admin(request):
    # Check if we're in a test session that might use firebase,
    # otherwise this mock might be too broad.
    # For now, apply session-wide for simplicity as auth_service imports firebase_admin.

    # Mock firebase_admin.credentials.Certificate
    # Create a mock object that can be called and returns another mock
    mock_certificate = MagicMock()
    # When firebase_admin.credentials.Certificate(path) is called, it returns a dummy object
    mock_certificate.return_value = MagicMock()

    # Mock firebase_admin.initialize_app
    mock_initialize_app = MagicMock()

    # Mock firebase_admin.auth for verify_id_token if Google login tests were being added
    mock_firebase_auth = MagicMock()
    mock_firebase_auth.verify_id_token.return_value = {
        "uid": "test_firebase_uid",
        "email": "firebaseuser@example.com",
        "name": "Firebase User",
        "picture": None,
    }  # Dummy decoded token

    patches = [
        patch("firebase_admin.credentials.Certificate", mock_certificate),
        patch("firebase_admin.initialize_app", mock_initialize_app),
        patch(
            "firebase_admin.auth.verify_id_token", mock_firebase_auth.verify_id_token
        ),  # Mock specific function
    ]

    for p in patches:
        p.start()
        request.addfinalizer(p.stop)

    # Also, to prevent the "Firebase service account not found" print,
    # we can temporarily set one of the expected firebase env vars
    # so the code thinks it's configured, but initialize_app being mocked means nothing happens.
    # This is optional and depends on whether the print is problematic.
    # with patch.dict(os.environ, {"FIREBASE_PROJECT_ID": "test-project"}, clear=True):
    # yield

    # If not using the os.environ patch, just yield:
    yield


@pytest_asyncio.fixture(scope="function", autouse=True)
async def mock_db():
    print("mock_db fixture: Creating AsyncMongoMockClient")
    mock_mongo_client = AsyncMongoMockClient()
    print(f"mock_db fixture: mock_mongo_client type: {type(mock_mongo_client)}")
    mock_database_instance = mock_mongo_client["test_db"]
    print(
        f"mock_db fixture: mock_database_instance type: {type(mock_database_instance)}, is None: {mock_database_instance is None}"
    )

    # Patch get_database for all services that use it
    patches = [
        patch("app.database.get_database", return_value=mock_database_instance),
    ]

    # Start all patches
    for p in patches:
        p.start()

    try:
        yield mock_database_instance
    finally:
        # Stop all patches
        for p in patches:
            p.stop()

    # Optional: clear all collections in the mock_database after each test
    # This ensures test isolation.
    # mongomock doesn't have a straightforward way to list all collections like a real DB,
    # so we might need to clear known collections if necessary, or rely on new client per test.
    # For now, a new AsyncMongoMockClient per function scope should provide good isolation.
