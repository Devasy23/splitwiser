import pytest
import mongomock
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import patch

# Make sure we can access the main app module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import necessary modules from your application
from main import app  # The FastAPI app is in backend/main.py
from app.auth.service import AuthService
from app.database import get_database, close_mongo_connection
from app.config import settings

# Fixture for a mock MongoDB client
@pytest.fixture(scope="session")
def mock_db_client():
    # Use mongomock for an in-memory MongoDB mock
    client = mongomock.MongoClient()
    yield client
    # No explicit close needed for mongomock typically, but good practice if it had one
    # client.close()

# Fixture to override the get_database dependency with the mock_db_client
@pytest.fixture(scope="function") # Use function scope to get a fresh db for each test
def db(mock_db_client):    # Get a specific database from the client, e.g., 'testdb'
    # This name can be arbitrary for mongomock
    test_db = mock_db_client[settings.database_name if settings.database_name else "testdb"]

    # Override the get_database dependency for the duration of the test
    # This uses FastAPI's dependency overrides
    original_get_database = app.dependency_overrides.get(get_database)
    app.dependency_overrides[get_database] = lambda: test_db
    yield test_db # This is what the tests will use as 'db'

    # Clean up: clear all collections in the test_db after each test
    for collection_name in test_db.list_collection_names():
        test_db[collection_name].delete_many({})

    # Restore original dependency (if any)
    if original_get_database:
        app.dependency_overrides[get_database] = original_get_database
    else:
        del app.dependency_overrides[get_database]


# Fixture for an AuthService instance that uses the mock database
@pytest.fixture(scope="function")
def auth_service_mocked(db): # Depends on the 'db' fixture
    service = AuthService()
    # The AuthService's get_db method will now use the overridden get_database,
    # so it will receive the mongomock instance.
    return service

# Fixture for the FastAPI TestClient
@pytest.fixture(scope="session")
def client(mock_db_client): # Ensures mock_db_client is initialized for the session
    # The TestClient will use the app, which will have its get_database
    # dependency overridden by the 'db' fixture when tests run.
    with TestClient(app) as test_client:
        yield test_client
    # Ensure MongoDB connection is closed if it were a real one
    # For mongomock, this might not be strictly necessary but good for consistency
    # if you have a close_mongo_connection function.
    # Example: close_mongo_connection() # Call your app's actual close function if applicable

# Add Firebase mocking for tests
@pytest.fixture(scope="session", autouse=True)
def mock_firebase():
    """Mock Firebase initialization for all tests"""
    with patch('firebase_admin.initialize_app') as mock_init, \
         patch('firebase_admin._apps', []):  # Mock empty apps list
        # Mock Firebase initialization to prevent real Firebase calls
        mock_init.return_value = None
        yield mock_init

@pytest.fixture(scope="function")
def mock_firebase_auth():
    """Mock Firebase auth operations for individual tests"""
    with patch('firebase_admin.auth.verify_id_token') as mock_verify:
        # Default mock response for Google auth tests
        mock_verify.return_value = {
            'uid': 'test_firebase_uid',
            'email': 'test@example.com',
            'name': 'Test User',
            'picture': 'https://example.com/avatar.jpg'
        }
        yield mock_verify

# Configure test environment variables
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment variables"""
    import os
    
    # Set test environment variables if not already set
    test_env_vars = {
        'SECRET_KEY': 'test-secret-key-for-testing-32-characters-long',
        'ALGORITHM': 'HS256',
        'ACCESS_TOKEN_EXPIRE_MINUTES': '15',
        'REFRESH_TOKEN_EXPIRE_DAYS': '30',
        'MONGODB_URL': 'mongodb://localhost:27017',
        'DATABASE_NAME': 'splitwiser_test',
        'DEBUG': 'true',
        'FIREBASE_PROJECT_ID': 'test-project',
        'FIREBASE_TYPE': 'service_account',
        'ALLOWED_ORIGINS': 'http://localhost:3000'
    }
    
    for key, value in test_env_vars.items():
        if not os.getenv(key):
            os.environ[key] = value
    
    yield
    
    # Cleanup - remove test env vars if we set them
    for key in test_env_vars:
        if os.environ.get(key) == test_env_vars[key]:
            os.environ.pop(key, None)

# It's also good practice to ensure any global resources are cleaned up.
# For example, if Firebase is initialized, you might want to mock or control its initialization for tests.
# For now, we'll assume Firebase interactions will be mocked directly in tests where needed.

# If your app has startup/shutdown events that manage resources (like a real DB connection),
# TestClient handles them automatically.
