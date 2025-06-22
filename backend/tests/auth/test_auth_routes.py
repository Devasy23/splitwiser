import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI, status
from main import app # Assuming your FastAPI app instance is here
from app.config import settings # To potentially override settings if needed, or check values
from app.auth.security import verify_password, get_password_hash # For checking hashed password if necessary
from datetime import datetime
from bson import ObjectId

# It's good practice to set a specific test secret key if not relying on external env vars
# For now, we assume 'your-super-secret-jwt-key-change-this-in-production' from config.py is used,
# or an environment variable overrides it.
# Ensure settings.secret_key is sufficiently long/random for HS256, the default is.

# Helper to get the mock_db if direct interaction is needed (though often not preferred)
# from app.database import get_database

@pytest.mark.asyncio
async def test_signup_with_email_success(mock_db): # mock_db fixture is auto-used
    """
    Test successful user signup via email, verifying response tokens and user creation.
    
    Sends a valid signup request to the email signup endpoint and asserts that the response contains access and refresh tokens, as well as correct user data. Confirms that the user is created in the mock database with a hashed password and that a corresponding refresh token is stored and not revoked.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        signup_data = {
            "email": "testuser@example.com",
            "password": "securepassword123",
            "name": "Test User"
        }
        response = await ac.post("/auth/signup/email", json=signup_data)
    print(f"Response text for test_signup_with_email_success: {response.text}") # Print response text
    assert response.status_code == status.HTTP_200_OK # Or the actual success code used by the app
    response_data = response.json()
    assert "access_token" in response_data
    assert "refresh_token" in response_data
    assert "user" in response_data
    assert response_data["user"]["email"] == signup_data["email"]
    assert response_data["user"]["name"] == signup_data["name"]
    assert "_id" in response_data["user"] # Changed 'id' to '_id'

    # Verify user creation in the mock database
    # db = get_database() # This will be the mock_db instance due to the fixture
    # Directly using mock_db fixture passed to test function
    created_user = await mock_db.users.find_one({"email": signup_data["email"]})
    assert created_user is not None
    assert created_user["name"] == signup_data["name"]
    assert verify_password(signup_data["password"], created_user["hashed_password"])

    # Verify refresh token creation
    refresh_token_record = await mock_db.refresh_tokens.find_one({"user_id": created_user["_id"]})
    assert refresh_token_record is not None
    assert not refresh_token_record["revoked"]
    assert response_data["refresh_token"] == refresh_token_record["token"]

@pytest.mark.asyncio
async def test_signup_with_existing_email(mock_db):
    # Pre-populate with a user
    """
    Test that signing up with an existing email returns a 400 error and appropriate error message.
    
    Ensures the API rejects duplicate email registrations and provides a clear error response.
    """
    existing_email = "existing@example.com"
    await mock_db.users.insert_one({
        "email": existing_email,
        "hashed_password": "hashedpassword",
        "name": "Existing User",
        "created_at": "sometime" # Simplified for mock
    })

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        signup_data = {
            "email": existing_email,
            "password": "newpassword123",
            "name": "New User"
        }
        response = await ac.post("/auth/signup/email", json=signup_data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    response_data = response.json()
    assert "detail" in response_data
    assert "User with this email already exists" in response_data["detail"]

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload_modifier, affected_field, description",
    [
        (lambda p: p.pop("email"), "email", "missing_email"),
        (lambda p: p.pop("password"), "password", "missing_password"),
        (lambda p: p.pop("name"), "name", "missing_name"),
        (lambda p: p.update({"password": "short"}), "password", "short_password"),
        (lambda p: p.update({"email": "invalidemail"}), "email", "invalid_email"),
    ]
)
async def test_signup_invalid_input_refined(mock_db, payload_modifier, affected_field, description):
    """
    Test that the signup endpoint returns appropriate validation errors for various invalid input payloads.
    
    This parameterized test modifies the signup payload to simulate different invalid input scenarios (such as missing fields, short passwords, or invalid email formats), sends a POST request to the signup endpoint, and asserts that the response contains a 422 status code with a validation error corresponding to the affected field and error type.
    """
    base_payload = {
        "email": "testuser@example.com",
        "password": "securepassword123",
        "name": "Test User"
    }
    payload_modifier(base_payload) # Modify the payload based on the current test case

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/auth/signup/email", json=base_payload)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    assert "detail" in response_data

    error_found = False
    for error_item in response_data["detail"]:
        # Check if the 'loc' array (location of the error) contains the affected_field
        if affected_field in error_item.get("loc", []):
            error_type = error_item.get("type", "")
            # Specific checks for error types for Pydantic v2
            if description == "short_password" and error_type == "string_too_short":
                error_found = True
                break
            elif description == "invalid_email" and error_type == "value_error": # Simpler check, msg gives more detail
                error_found = True
                break
            elif "missing" in description and error_type == "missing":
                error_found = True
                break
    assert error_found, f"Validation error for '{description}' (field: {affected_field}) not found or not specific enough in {response_data['detail']}"


@pytest.mark.asyncio
async def test_login_with_email_success(mock_db):
    """
    Test successful login with email and password, verifying token issuance and user data.
    
    This test ensures that a user can log in with valid credentials, receives access and refresh tokens, and that the returned user data matches the database. It also confirms that a refresh token is created in the database, is not revoked, and matches the token in the response.
    """
    user_email = "loginuser@example.com"
    user_password = "loginpassword123"
    hashed_password = get_password_hash(user_password)

    # Pre-populate user in mock_db
    # Ensure _id is an ObjectId if other parts of the code expect it,
    # though for mock_db string usually works fine unless there's specific BSON type checking.
    # For consistency with how AuthService creates user_id for refresh tokens (ObjectId(user_id)),
    # let's store _id as ObjectId here.
    user_obj_id = ObjectId()
    await mock_db.users.insert_one({
        "_id": user_obj_id,
        "email": user_email,
        "hashed_password": hashed_password,
        "name": "Login User",
        "avatar": None,
        "currency": "USD",
        "created_at": datetime.utcnow(), # Ensure datetime is used
        "auth_provider": "email",
        "firebase_uid": None
    })

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_data = {
            "email": user_email,
            "password": user_password
        }
        response = await ac.post("/auth/login/email", json=login_data)

    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert "access_token" in response_data
    assert "refresh_token" in response_data
    assert "user" in response_data
    assert response_data["user"]["email"] == user_email
    assert response_data["user"]["_id"] == str(user_obj_id) # Changed 'id' to '_id'

    # Verify refresh token creation for this user
    # Refresh token service stores user_id as ObjectId
    refresh_token_record = await mock_db.refresh_tokens.find_one({"user_id": user_obj_id})
    assert refresh_token_record is not None
    assert not refresh_token_record["revoked"]
    assert response_data["refresh_token"] == refresh_token_record["token"]

@pytest.mark.asyncio
async def test_login_with_incorrect_password(mock_db):
    """
    Test that logging in with an incorrect password returns a 401 Unauthorized error and an appropriate error message.
    """
    user_email = "wrongpass@example.com"
    correct_password = "correctpassword"
    incorrect_password = "incorrectpassword"

    await mock_db.users.insert_one({
        "_id": ObjectId(),
        "email": user_email,
        "hashed_password": get_password_hash(correct_password),
        "name": "Wrong Pass User",
        "created_at": datetime.utcnow()
    })

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_data = {
            "email": user_email,
            "password": incorrect_password
        }
        response = await ac.post("/auth/login/email", json=login_data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    response_data = response.json()
    assert "detail" in response_data
    assert "Incorrect email or password" in response_data["detail"]

@pytest.mark.asyncio
async def test_login_with_non_existent_email(mock_db):
    """
    Test that logging in with a non-existent email returns a 401 Unauthorized error with a generic credentials message.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_data = {
            "email": "nosuchuser@example.com",
            "password": "anypassword"
        }
        response = await ac.post("/auth/login/email", json=login_data)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    response_data = response.json()
    assert "detail" in response_data
    assert "Incorrect email or password" in response_data["detail"] # Same message for both cases

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload_modifier, affected_field, description",
    [
        (lambda p: p.pop("email"), "email", "missing_email"),
        (lambda p: p.pop("password"), "password", "missing_password"),
        (lambda p: p.update({"email": "invalidemailformat"}), "email", "invalid_email_format"),
    ]
)
async def test_login_invalid_input(mock_db, payload_modifier, affected_field, description):
    """
    Test that the login endpoint returns appropriate validation errors for invalid input payloads.
    
    This parameterized test modifies the login payload to simulate various invalid input scenarios (such as missing fields or invalid email format), sends a POST request to the login endpoint, and asserts that the response contains the expected validation error for the affected field.
    """
    base_payload = {
        "email": "validuser@example.com",
        "password": "validpassword123"
    }
    # It doesn't matter if the user exists or not for input validation,
    # as validation happens before DB lookup for these kinds of errors.
    payload_modifier(base_payload)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/auth/login/email", json=base_payload)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    response_data = response.json()
    assert "detail" in response_data

    error_found = False
    for error_item in response_data["detail"]:
        if affected_field in error_item.get("loc", []):
            error_type = error_item.get("type", "")
            if description == "invalid_email_format" and error_type == "value_error": # Simpler check
                error_found = True
                break
            elif "missing" in description and error_type == "missing":
                error_found = True
                break
    assert error_found, f"Validation error for '{description}' (field: {affected_field}) not found in {response_data['detail']}"
