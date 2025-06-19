import pytest
from fastapi.testclient import TestClient # TestClient is also available via the 'client' fixture
from app.database import get_database # Or use the 'db' fixture directly
from bson import ObjectId # If needed for DB checks
from unittest.mock import patch
from datetime import datetime, timedelta
import firebase_admin.auth
from jose import jwt

from app.auth.security import create_access_token
from app.config import settings


# Note: 'client' and 'db' fixtures are defined in conftest.py and available automatically.

@pytest.mark.asyncio
async def test_signup_with_email_success(client: TestClient, db):
    request_data = {
        "email": "signup_route@example.com",
        "password": "password123",
        "name": "Signup Route User"
    }
    response = client.post("/auth/signup/email", json=request_data)

    assert response.status_code == 200
    response_data = response.json()

    assert "access_token" in response_data
    assert "refresh_token" in response_data
    assert "user" in response_data
    assert response_data["user"]["email"] == request_data["email"]
    assert response_data["user"]["name"] == request_data["name"]
    assert "id" in response_data["user"] # UserResponse uses 'id' as alias for '_id'

    # Verify user in database
    user_in_db = await db.users.find_one({"email": request_data["email"]})
    assert user_in_db is not None
    assert user_in_db["name"] == request_data["name"]
    assert str(user_in_db["_id"]) == response_data["user"]["id"]

    # Verify refresh token in database
    refresh_token_in_db = await db.refresh_tokens.find_one({
        "user_id": user_in_db["_id"], # Here user_in_db["_id"] is ObjectId
        "token": response_data["refresh_token"]
    })
    assert refresh_token_in_db is not None
    assert not refresh_token_in_db["revoked"]

@pytest.mark.asyncio
async def test_signup_with_email_duplicate(client: TestClient, db):
    request_data = {
        "email": "signup_duplicate@example.com",
        "password": "password123",
        "name": "Signup Duplicate User"
    }
    # First signup: should succeed
    response1 = client.post("/auth/signup/email", json=request_data)
    assert response1.status_code == 200

    # Second signup with the same email: should fail
    response2 = client.post("/auth/signup/email", json={
        "email": "signup_duplicate@example.com",
        "password": "anotherpassword",
        "name": "Another Name"
    })
    assert response2.status_code == 400 # As per AuthService logic for duplicate email
    response_data2 = response2.json()
    assert "detail" in response_data2
    assert "user with this email already exists" in str(response_data2["detail"]).lower()

    # Verify only one user with that email exists
    count = await db.users.count_documents({"email": request_data["email"]})
    assert count == 1

@pytest.mark.asyncio
async def test_signup_with_email_invalid_input(client: TestClient):
    # Test with missing email
    response_missing_email = client.post("/auth/signup/email", json={
        "password": "password123",
        "name": "Test Name"
    })
    assert response_missing_email.status_code == 422 # FastAPI validation error

    # Test with invalid email format
    response_invalid_email = client.post("/auth/signup/email", json={
        "email": "not-an-email",
        "password": "password123",
        "name": "Test Name"
    })
    assert response_invalid_email.status_code == 422

    # Test with short password
    response_short_password = client.post("/auth/signup/email", json={
        "email": "shortpass@example.com",
        "password": "123", # Too short, min_length=6
        "name": "Test Name"
    })
    assert response_short_password.status_code == 422

    # Test with missing name
    response_missing_name = client.post("/auth/signup/email", json={
        "email": "noname@example.com",
        "password": "password123"
        # Name is missing
    })
    assert response_missing_name.status_code == 422


@pytest.mark.asyncio
async def test_login_with_email_success(client: TestClient, db):
    # 1. First, create a user to log in with
    signup_data = {
        "email": "login_route@example.com",
        "password": "password123",
        "name": "Login Route User"
    }
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    user_id_from_signup = signup_response.json()["user"]["id"] # String ID

    # 2. Attempt to login
    login_data = {
        "email": signup_data["email"],
        "password": signup_data["password"]
    }
    login_response = client.post("/auth/login/email", json=login_data)

    assert login_response.status_code == 200
    login_response_data = login_response.json()

    assert "access_token" in login_response_data
    assert "refresh_token" in login_response_data
    assert "user" in login_response_data
    assert login_response_data["user"]["email"] == signup_data["email"]
    assert login_response_data["user"]["id"] == user_id_from_signup

    # Verify new refresh token in database
    # user_id_from_signup is a string, convert to ObjectId for DB query
    # from bson import ObjectId # Make sure this import is at the top of the file
    user_id_obj = ObjectId(user_id_from_signup)

    refresh_token_in_db = await db.refresh_tokens.find_one({
        "user_id": user_id_obj,
        "token": login_response_data["refresh_token"],
        "revoked": False
    })
    assert refresh_token_in_db is not None

@pytest.mark.asyncio
async def test_login_with_email_incorrect_password(client: TestClient, db):
    # 1. Create a user
    signup_data = {
        "email": "login_wrongpass@example.com",
        "password": "password123",
        "name": "Login WrongPass User"
    }
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200

    # 2. Attempt login with incorrect password
    login_data = {
        "email": signup_data["email"],
        "password": "wrongpassword"
    }
    login_response = client.post("/auth/login/email", json=login_data)

    assert login_response.status_code == 401 # Unauthorized
    response_data = login_response.json()
    assert "detail" in response_data
    assert "incorrect email or password" in str(response_data["detail"]).lower()

@pytest.mark.asyncio
async def test_login_with_email_non_existent_user(client: TestClient, db):
    login_data = {
        "email": "nonexistent_login@example.com",
        "password": "password123"
    }
    login_response = client.post("/auth/login/email", json=login_data)

    assert login_response.status_code == 401 # Unauthorized
    response_data = login_response.json()
    assert "detail" in response_data
    assert "incorrect email or password" in str(response_data["detail"]).lower()

@pytest.mark.asyncio
async def test_login_with_email_invalid_input(client: TestClient):
    # Missing password
    response_missing_pass = client.post("/auth/login/email", json={"email": "test@example.com"})
    assert response_missing_pass.status_code == 422 # FastAPI validation error

    # Invalid email format
    response_invalid_email = client.post("/auth/login/email", json={"email": "not-an-email", "password": "password123"})
    assert response_invalid_email.status_code == 422


@pytest.mark.asyncio
async def test_login_with_google_new_user(client: TestClient, db):
    google_id_token = "mock_google_id_token_route_new"
    firebase_uid = "firebase_uid_route_new"
    email = "google_new_route@example.com"
    name = "Google New Route User"
    picture = "http://example.com/new_route_avatar.jpg"

    # The route calls auth_service.authenticate_with_google, which uses firebase_auth.verify_id_token
    # So we patch 'app.auth.service.firebase_auth.verify_id_token'
    with patch('app.auth.service.firebase_auth.verify_id_token') as mock_verify_id_token:
        mock_verify_id_token.return_value = {
            'uid': firebase_uid,
            'email': email,
            'name': name,
            'picture': picture
        }

        request_data = {"id_token": google_id_token}
        response = client.post("/auth/login/google", json=request_data)

        assert response.status_code == 200
        response_data = response.json()

        assert "access_token" in response_data
        assert "refresh_token" in response_data
        assert response_data["user"]["email"] == email
        assert response_data["user"]["name"] == name
        assert response_data["user"]["avatar"] == picture

        user_id_str = response_data["user"]["id"]

        mock_verify_id_token.assert_called_once_with(google_id_token)

        # Verify user in DB
        user_in_db = await db.users.find_one({"email": email})
        assert user_in_db is not None
        assert user_in_db["name"] == name
        assert user_in_db["firebase_uid"] == firebase_uid
        assert user_in_db["auth_provider"] == "google"
        assert str(user_in_db["_id"]) == user_id_str

        # Verify refresh token
        # from bson import ObjectId # Ensure this import is at the top
        refresh_token_in_db = await db.refresh_tokens.find_one({
            "user_id": ObjectId(user_id_str),
            "token": response_data["refresh_token"]
        })
        assert refresh_token_in_db is not None

@pytest.mark.asyncio
async def test_login_with_google_existing_user(client: TestClient, db):
    google_id_token = "mock_google_id_token_route_existing"
    firebase_uid = "firebase_uid_route_existing"
    email = "google_existing_route@example.com"
    original_name = "Original Name"
    google_name = "Google Existing Route User" # Name updated from Google
    original_picture = "http://example.com/original_route_avatar.jpg"
    google_picture = "http://example.com/existing_route_avatar.jpg" # Picture updated

    # 1. Create an initial user (e.g., signed up via email)
    # from datetime import datetime # Ensure datetime is imported
    initial_user_doc = {
        "email": email,
        "name": original_name,
        "avatar": original_picture,
        "currency": "USD",
        "created_at": datetime.utcnow(),
        "auth_provider": "email", # Initially 'email'
        "firebase_uid": None, # No firebase UID initially
        # No hashed_password needed if auth_provider is not email for this test,
        # but service logic might expect it or handle its absence.
        # For safety, let's add it.
        "hashed_password": "somepasswordhash"
    }
    insert_result = await db.users.insert_one(initial_user_doc)
    user_id_obj = insert_result.inserted_id
    user_id_str = str(user_id_obj)


    with patch('app.auth.service.firebase_auth.verify_id_token') as mock_verify_id_token:
        mock_verify_id_token.return_value = {
            'uid': firebase_uid, # This will be new or updated
            'email': email,
            'name': google_name,
            'picture': google_picture
        }

        request_data = {"id_token": google_id_token}
        response = client.post("/auth/login/google", json=request_data)

        assert response.status_code == 200
        response_data = response.json()

        assert response_data["user"]["email"] == email
        assert response_data["user"]["name"] == google_name # Name updated
        assert response_data["user"]["avatar"] == google_picture # Avatar updated
        assert response_data["user"]["id"] == user_id_str # Should be the same user

        mock_verify_id_token.assert_called_once_with(google_id_token)

        # Verify user in DB
        user_in_db = await db.users.find_one({"_id": user_id_obj})
        assert user_in_db is not None
        assert user_in_db["name"] == google_name
        assert user_in_db["firebase_uid"] == firebase_uid # UID updated
        assert user_in_db["avatar"] == google_picture
        # auth_provider might or might not change based on service logic, check service.py
        # Current service logic: if user exists, it doesn't change auth_provider.
        assert user_in_db["auth_provider"] == "email"

@pytest.mark.asyncio
async def test_login_with_google_invalid_id_token(client: TestClient, db):
    google_id_token = "invalid_google_id_token_route"

    with patch('app.auth.service.firebase_auth.verify_id_token') as mock_verify_id_token:
        # Import the specific exception type
        # import firebase_admin.auth # Already imported at top
        mock_verify_id_token.side_effect = firebase_admin.auth.InvalidIdTokenError("Mocked Invalid ID Token")

        request_data = {"id_token": google_id_token}
        response = client.post("/auth/login/google", json=request_data)

        assert response.status_code == 401 # Based on service exception handling
        response_data = response.json()
        assert "invalid google id token" in str(response_data["detail"]).lower()
        mock_verify_id_token.assert_called_once_with(google_id_token)

@pytest.mark.asyncio
async def test_login_with_google_missing_email_in_token(client: TestClient, db):
    google_id_token = "mock_google_id_token_route_no_email"
    firebase_uid = "firebase_uid_route_no_email"
    name = "Google No Email Route User"

    with patch('app.auth.service.firebase_auth.verify_id_token') as mock_verify_id_token:
        mock_verify_id_token.return_value = {
            'uid': firebase_uid,
            'name': name
            # Email is missing from Google token
        }
        request_data = {"id_token": google_id_token}
        response = client.post("/auth/login/google", json=request_data)

        assert response.status_code == 400 # Based on service exception handling
        response_data = response.json()
        assert "email not provided by google" in str(response_data["detail"]).lower()
        mock_verify_id_token.assert_called_once_with(google_id_token)


@pytest.mark.asyncio
async def test_refresh_token_success(client: TestClient, db):
    # 1. Sign up and get initial tokens
    signup_data = {
        "email": "refresh_route@example.com",
        "password": "password123",
        "name": "Refresh Route User"
    }
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    signup_response_data = signup_response.json()
    original_refresh_token = signup_response_data["refresh_token"]
    user_id_str = signup_response_data["user"]["id"]
    user_id_obj = ObjectId(user_id_str)

    # 2. Verify original refresh token in DB
    original_token_doc_before_refresh = await db.refresh_tokens.find_one({
        "user_id": user_id_obj,
        "token": original_refresh_token
    })
    assert original_token_doc_before_refresh is not None
    assert not original_token_doc_before_refresh["revoked"]

    # 3. Make the refresh request
    refresh_request_data = {"refresh_token": original_refresh_token}
    refresh_response = client.post("/auth/refresh", json=refresh_request_data)

    assert refresh_response.status_code == 200
    refresh_response_data = refresh_response.json()

    assert "access_token" in refresh_response_data
    assert "refresh_token" in refresh_response_data # New refresh token due to rotation
    new_refresh_token = refresh_response_data["refresh_token"]
    assert new_refresh_token != original_refresh_token

    # 4. Verify old refresh token is revoked in DB
    old_token_doc_after_refresh = await db.refresh_tokens.find_one({
        "user_id": user_id_obj,
        "token": original_refresh_token
    })
    assert old_token_doc_after_refresh is not None
    assert old_token_doc_after_refresh["revoked"]

    # 5. Verify new refresh token exists in DB and is not revoked
    new_token_doc = await db.refresh_tokens.find_one({
        "user_id": user_id_obj,
        "token": new_refresh_token
    })
    assert new_token_doc is not None
    assert not new_token_doc["revoked"]

@pytest.mark.asyncio
async def test_refresh_token_invalid_or_expired(client: TestClient, db):
    # Test with a completely bogus token
    refresh_request_data = {"refresh_token": "this_is_not_a_valid_token"}
    response = client.post("/auth/refresh", json=refresh_request_data)
    assert response.status_code == 401 # Unauthorized
    response_data = response.json()
    assert "invalid or expired refresh token" in str(response_data["detail"]).lower()

    # Test with an expired token (requires manual DB manipulation)
    signup_data = {
        "email": "refresh_expired_route@example.com",
        "password": "password123",
        "name": "Refresh Expired Route User"
    }
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    expired_refresh_token = signup_response.json()["refresh_token"]
    user_id_str = signup_response.json()["user"]["id"]
    user_id_obj = ObjectId(user_id_str)

    # Manually expire the token
    # from datetime import datetime, timedelta # Ensure imports
    await db.refresh_tokens.update_one(
        {"token": expired_refresh_token, "user_id": user_id_obj},
        {"$set": {"expires_at": datetime.utcnow() - timedelta(days=1)}}
    )

    expired_refresh_request_data = {"refresh_token": expired_refresh_token}
    expired_response = client.post("/auth/refresh", json=expired_refresh_request_data)
    assert expired_response.status_code == 401
    expired_response_data = expired_response.json()
    assert "invalid or expired refresh token" in str(expired_response_data["detail"]).lower()


@pytest.mark.asyncio
async def test_refresh_token_revoked(client: TestClient, db):
    # 1. Sign up to get a valid token
    signup_data = {
        "email": "refresh_revoked_route@example.com",
        "password": "password123",
        "name": "Refresh Revoked Route User"
    }
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    revoked_refresh_token = signup_response.json()["refresh_token"]
    user_id_str = signup_response.json()["user"]["id"]
    user_id_obj = ObjectId(user_id_str)

    # 2. Manually revoke the token in the DB
    update_result = await db.refresh_tokens.update_one(
        {"token": revoked_refresh_token, "user_id": user_id_obj},
        {"$set": {"revoked": True}}
    )
    assert update_result.modified_count == 1


    # 3. Attempt to use the now revoked token
    refresh_request_data = {"refresh_token": revoked_refresh_token}
    response = client.post("/auth/refresh", json=refresh_request_data)
    assert response.status_code == 401
    response_data = response.json()
    # The service's error message for revoked token is "Invalid or expired refresh token"
    assert "invalid or expired refresh token" in str(response_data["detail"]).lower()

@pytest.mark.asyncio
async def test_refresh_token_missing_input(client: TestClient):
    response = client.post("/auth/refresh", json={}) # Missing refresh_token
    assert response.status_code == 422 # FastAPI validation error


@pytest.mark.asyncio
async def test_verify_token_success(client: TestClient, db):
    # 1. Sign up to get a user and an initial access token (or just create a user and then an access token)
    signup_data = {
        "email": "verify_route@example.com",
        "password": "password123",
        "name": "Verify Route User"
    }
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    signup_response_data = signup_response.json()
    access_token = signup_response_data["access_token"]
    expected_user_data = signup_response_data["user"]

    # 2. Make the token verification request
    verify_request_data = {"access_token": access_token}
    verify_response = client.post("/auth/token/verify", json=verify_request_data)

    assert verify_response.status_code == 200
    verify_response_data = verify_response.json()

    # UserResponse schema has 'id' aliased to '_id', so we compare them.
    # It also has created_at as datetime, FastAPI TestClient serializes it to string.
    # For a robust comparison, compare key fields.
    assert verify_response_data["id"] == expected_user_data["id"]
    assert verify_response_data["email"] == expected_user_data["email"]
    assert verify_response_data["name"] == expected_user_data["name"]
    assert verify_response_data["avatar"] == expected_user_data["avatar"] # Should be None here
    assert verify_response_data["currency"] == expected_user_data["currency"]
    # Datetime comparison can be tricky due to precision or timezone.
    # Parsing the string back to datetime or checking for presence is safer.
    assert "created_at" in verify_response_data

@pytest.mark.asyncio
async def test_verify_token_invalid_signature(client: TestClient, db):
    # Create a token with a different secret key
    # We need ObjectId for user creation if we want the user to exist,
    # but for an invalid signature, the user lookup step isn't even reached.
    user_id_for_bad_token = str(ObjectId()) # Dummy user ID

    # Ensure settings are loaded for jwt.encode
    # from app.config import settings # Imported at top

    invalid_signed_token = jwt.encode(
        {"sub": user_id_for_bad_token, "exp": datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)},
        "a_completely_wrong_secret_key", # Different secret
        algorithm=settings.algorithm
    )

    verify_request_data = {"access_token": invalid_signed_token}
    response = client.post("/auth/token/verify", json=verify_request_data)

    assert response.status_code == 401 # Unauthorized
    response_data = response.json()
    # This detail comes from the security.verify_token -> JWTError
    assert "could not validate credentials" in str(response_data["detail"]).lower()


@pytest.mark.asyncio
async def test_verify_token_expired(client: TestClient, db):
    # 1. Create a user so the user lookup part of verify_access_token can potentially pass if token wasn't expired
    user_email = "expired_verify_route@example.com"
    user_doc_result = await db.users.insert_one({
        "email": user_email, "name": "Expired Token User",
        "hashed_password": "abc", "created_at": datetime.utcnow(), "_id": ObjectId()
    })
    user_id_str = str(user_doc_result.inserted_id)

    # 2. Create an expired access token
    # from app.auth.security import create_access_token # Imported at top
    # from datetime import timedelta # Imported at top
    expired_token = create_access_token(
        data={"sub": user_id_str},
        expires_delta=timedelta(minutes=-5) # Expired 5 minutes ago
    )

    verify_request_data = {"access_token": expired_token}
    response = client.post("/auth/token/verify", json=verify_request_data)

    assert response.status_code == 401 # Unauthorized
    response_data = response.json()
    # This detail comes from the security.verify_token -> JWTError (e.g. ExpiredSignatureError)
    assert "could not validate credentials" in str(response_data["detail"]).lower()


@pytest.mark.asyncio
async def test_verify_token_user_not_found(client: TestClient, db):
    # 1. Create a valid token for a user ID that won't be in the database
    non_existent_user_id = str(ObjectId()) # Generate a valid ObjectId string

    # from app.auth.security import create_access_token # Imported at top
    access_token_for_non_existent_user = create_access_token(data={"sub": non_existent_user_id})

    verify_request_data = {"access_token": access_token_for_non_existent_user}
    response = client.post("/auth/token/verify", json=verify_request_data)

    assert response.status_code == 401 # Unauthorized
    response_data = response.json()
    # This detail comes from AuthService.verify_access_token after failing to find user
    assert "user not found" in str(response_data["detail"]).lower()


@pytest.mark.asyncio
async def test_verify_token_missing_input(client: TestClient):
    response = client.post("/auth/token/verify", json={}) # Missing access_token
    assert response.status_code == 422 # FastAPI validation error


@pytest.mark.asyncio
async def test_request_password_reset_existing_email(client: TestClient, db):
    # 1. Create a user
    signup_data = {
        "email": "reset_request_route@example.com",
        "password": "password123",
        "name": "Reset Request Route User"
    }
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    user_id_str = signup_response.json()["user"]["id"]
    user_id_obj = ObjectId(user_id_str)

    # 2. Make the password reset request
    # Patch 'print' in the service layer to avoid console output and to verify calls
    with patch('app.auth.service.print') as mock_print:
        request_data = {"email": signup_data["email"]}
        response = client.post("/auth/password/reset/request", json=request_data)

    assert response.status_code == 200
    response_data = response.json()
    assert response_data["success"] is True
    assert "if the email exists, a reset link has been sent" in response_data["message"].lower()

    # 3. Verify a password reset token was created in the DB for the user
    reset_record = await db.password_resets.find_one({"user_id": user_id_obj})
    assert reset_record is not None
    assert "token" in reset_record
    assert "expires_at" in reset_record
    assert not reset_record["used"]

    # 4. Verify that the print function in the service was called (as user exists)
    assert mock_print.call_count >= 1 # Service prints token and link

@pytest.mark.asyncio
async def test_request_password_reset_non_existent_email(client: TestClient, db):
    non_existent_email = "i_do_not_exist_for_reset@example.com"

    with patch('app.auth.service.print') as mock_print:
        request_data = {"email": non_existent_email}
        response = client.post("/auth/password/reset/request", json=request_data)

    assert response.status_code == 200 # Should still be 200
    response_data = response.json()
    assert response_data["success"] is True
    assert "if the email exists, a reset link has been sent" in response_data["message"].lower()

    # Verify no password reset token was created in the DB
    # (as no user_id would be found for this email)
    # This check is a bit indirect; we are checking that no new records appeared.
    # Since the db fixture cleans up, password_resets should be empty.
    count = await db.password_resets.count_documents({})
    assert count == 0

    # Verify that print was NOT called in the service (as user does not exist)
    assert mock_print.call_count == 0


@pytest.mark.asyncio
async def test_request_password_reset_invalid_email_format(client: TestClient):
    request_data = {"email": "not-a-valid-email"}
    response = client.post("/auth/password/reset/request", json=request_data)

    assert response.status_code == 422 # FastAPI validation error
    # No need to check print or DB as it fails at validation layer


@pytest.mark.asyncio
async def test_confirm_password_reset_success(client: TestClient, db):
    # 1. Create a user
    email = "confirm_reset_route@example.com"
    old_password = "oldPasswordRoute123"
    new_password = "newPasswordRoute456"
    signup_data = {"email": email, "password": old_password, "name": "Confirm Reset Route User"}
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    user_id_str = signup_response.json()["user"]["id"]
    user_id_obj = ObjectId(user_id_str)

    # 2. Manually create a valid password reset token in the DB (as if /request was called)
    reset_token_value = "valid_reset_token_for_route_confirm"
    await db.password_resets.insert_one({
        "user_id": user_id_obj,
        "token": reset_token_value,
        "expires_at": datetime.utcnow() + timedelta(hours=1),
        "used": False,
        "created_at": datetime.utcnow()
    })

    # 3. Create a refresh token for the user (as if they logged in once)
    # We can get one by actually logging in the user before password reset.
    login_data = {"email": email, "password": old_password}
    login_response = client.post("/auth/login/email", json=login_data)
    assert login_response.status_code == 200
    initial_refresh_token = login_response.json()["refresh_token"]

    # Verify this initial refresh token is valid and not revoked
    initial_rt_doc = await db.refresh_tokens.find_one({"token": initial_refresh_token, "user_id": user_id_obj})
    assert initial_rt_doc is not None and not initial_rt_doc["revoked"]

    # 4. Make the password reset confirm request
    confirm_request_data = {"reset_token": reset_token_value, "new_password": new_password}
    confirm_response = client.post("/auth/password/reset/confirm", json=confirm_request_data)

    assert confirm_response.status_code == 200
    confirm_response_data = confirm_response.json()
    assert confirm_response_data["success"] is True
    assert "password has been reset successfully" in confirm_response_data["message"].lower()

    # 5. Verify password was changed by trying to login with the new password
    new_login_data = {"email": email, "password": new_password}
    new_login_response = client.post("/auth/login/email", json=new_login_data)
    assert new_login_response.status_code == 200, f"Login with new password failed: {new_login_response.json()}"

    # 6. Verify old password no longer works
    old_login_data = {"email": email, "password": old_password}
    old_login_response = client.post("/auth/login/email", json=old_login_data)
    assert old_login_response.status_code == 401 # Incorrect email or password

    # 7. Verify the reset token was marked as used in DB
    reset_record_used = await db.password_resets.find_one({"token": reset_token_value})
    assert reset_record_used is not None
    assert reset_record_used["used"] is True

    # 8. Verify all previous refresh tokens for the user were revoked
    # The initial_refresh_token should now be revoked.
    revoked_rt_doc = await db.refresh_tokens.find_one({"token": initial_refresh_token, "user_id": user_id_obj})
    assert revoked_rt_doc is not None and revoked_rt_doc["revoked"]

    # Check if any non-revoked refresh tokens exist for this user (there shouldn't be)
    active_refresh_tokens_count = await db.refresh_tokens.count_documents({"user_id": user_id_obj, "revoked": False})
    assert active_refresh_tokens_count == 0


@pytest.mark.asyncio
async def test_confirm_password_reset_invalid_token(client: TestClient, db):
    request_data = {"reset_token": "this_is_a_bad_token", "new_password": "someNewPassword123"}
    response = client.post("/auth/password/reset/confirm", json=request_data)

    assert response.status_code == 400 # Bad Request
    response_data = response.json()
    assert "invalid or expired reset token" in str(response_data["detail"]).lower()

@pytest.mark.asyncio
async def test_confirm_password_reset_expired_token(client: TestClient, db):
    # 1. Create user
    email = "confirm_expired_route@example.com"
    signup_data = {"email": email, "password": "password123", "name": "Confirm Expired Route"}
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    user_id_obj = ObjectId(signup_response.json()["user"]["id"])

    # 2. Manually create an expired password reset token
    expired_token_value = "expired_reset_token_for_route"
    await db.password_resets.insert_one({
        "user_id": user_id_obj,
        "token": expired_token_value,
        "expires_at": datetime.utcnow() - timedelta(hours=1), # Expired
        "used": False, "created_at": datetime.utcnow() - timedelta(hours=2)
    })

    request_data = {"reset_token": expired_token_value, "new_password": "someNewPassword123"}
    response = client.post("/auth/password/reset/confirm", json=request_data)

    assert response.status_code == 400
    response_data = response.json()
    assert "invalid or expired reset token" in str(response_data["detail"]).lower()

@pytest.mark.asyncio
async def test_confirm_password_reset_token_already_used(client: TestClient, db):
    # 1. Create user
    email = "confirm_used_route@example.com"
    signup_data = {"email": email, "password": "password123", "name": "Confirm Used Route"}
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    user_id_obj = ObjectId(signup_response.json()["user"]["id"])

    # 2. Manually create a used password reset token
    used_token_value = "used_reset_token_for_route"
    await db.password_resets.insert_one({
        "user_id": user_id_obj,
        "token": used_token_value,
        "expires_at": datetime.utcnow() + timedelta(hours=1), # Not expired
        "used": True, # Already used
        "created_at": datetime.utcnow()
    })

    request_data = {"reset_token": used_token_value, "new_password": "someNewPassword123"}
    response = client.post("/auth/password/reset/confirm", json=request_data)

    assert response.status_code == 400
    response_data = response.json()
    assert "invalid or expired reset token" in str(response_data["detail"]).lower()


@pytest.mark.asyncio
async def test_confirm_password_reset_invalid_input(client: TestClient):
    # Missing reset_token
    response_missing_token = client.post("/auth/password/reset/confirm", json={"new_password": "someNewPassword123"})
    assert response_missing_token.status_code == 422

    # Missing new_password
    response_missing_password = client.post("/auth/password/reset/confirm", json={"reset_token": "sometoken"})
    assert response_missing_password.status_code == 422

    # Password too short
    response_short_password = client.post("/auth/password/reset/confirm", json={"reset_token": "sometoken", "new_password": "123"}) # min_length=6
    assert response_short_password.status_code == 422


# Additional integration and edge case tests for comprehensive coverage

@pytest.mark.asyncio
async def test_full_authentication_flow_integration(client: TestClient, db):
    """Integration test covering complete authentication flow"""
    email = "integration_test@example.com"
    password = "integration123"
    name = "Integration Test User"
    
    # 1. Signup
    signup_data = {"email": email, "password": password, "name": name}
    signup_response = client.post("/auth/signup/email", json=signup_data)
    assert signup_response.status_code == 200
    signup_data_response = signup_response.json()
    
    access_token = signup_data_response["access_token"]
    refresh_token = signup_data_response["refresh_token"]
    user_id = signup_data_response["user"]["id"]
    
    # 2. Verify token works
    verify_response = client.post("/auth/token/verify", json={"access_token": access_token})
    assert verify_response.status_code == 200
    assert verify_response.json()["id"] == user_id
    
    # 3. Refresh token
    refresh_response = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_response.status_code == 200
    new_access_token = refresh_response.json()["access_token"]
    new_refresh_token = refresh_response.json()["refresh_token"]
    
    # 4. Verify new token works
    verify_new_response = client.post("/auth/token/verify", json={"access_token": new_access_token})
    assert verify_new_response.status_code == 200
    
    # 5. Test password reset flow
    reset_request_response = client.post("/auth/password/reset/request", json={"email": email})
    assert reset_request_response.status_code == 200
    
    # Get reset token from database
    user_obj_id = ObjectId(user_id)
    reset_record = await db.password_resets.find_one({"user_id": user_obj_id})
    assert reset_record is not None
    
    # Confirm password reset
    new_password = "newintegration456"
    confirm_response = client.post("/auth/password/reset/confirm", json={
        "reset_token": reset_record["token"],
        "new_password": new_password
    })
    assert confirm_response.status_code == 200
    
    # 6. Login with new password
    login_response = client.post("/auth/login/email", json={"email": email, "password": new_password})
    assert login_response.status_code == 200
    
    # 7. Verify old refresh token is revoked
    old_refresh_response = client.post("/auth/refresh", json={"refresh_token": new_refresh_token})
    assert old_refresh_response.status_code == 401


@pytest.mark.asyncio
async def test_concurrent_refresh_token_usage(client: TestClient, db):
    """Test refresh token rotation with potential race conditions"""
    # Setup user
    signup_response = client.post("/auth/signup/email", json={
        "email": "concurrent_test@example.com",
        "password": "password123",
        "name": "Concurrent Test User"
    })
    refresh_token = signup_response.json()["refresh_token"]
    
    # Try to use the same refresh token twice (simulating race condition)
    response1 = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    response2 = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    
    # One should succeed, one should fail
    success_count = sum(1 for r in [response1, response2] if r.status_code == 200)
    failure_count = sum(1 for r in [response1, response2] if r.status_code == 401)
    
    assert success_count == 1, "Exactly one refresh should succeed"
    assert failure_count == 1, "Exactly one refresh should fail (token rotation)"


@pytest.mark.asyncio 
async def test_authentication_error_responses_consistency(client: TestClient, db):
    """Test that error responses are consistent across endpoints"""
    
    # Test invalid token format consistency
    invalid_tokens = ["", "invalid", "bearer token", "malformed.jwt.token"]
    
    for invalid_token in invalid_tokens:
        verify_response = client.post("/auth/token/verify", json={"access_token": invalid_token})
        assert verify_response.status_code == 401
        assert "detail" in verify_response.json()
        
        refresh_response = client.post("/auth/refresh", json={"refresh_token": invalid_token})
        assert refresh_response.status_code == 401
        assert "detail" in refresh_response.json()


@pytest.mark.asyncio
async def test_authentication_security_headers(client: TestClient, db):
    """Test that authentication endpoints handle security properly"""
    
    # Test all auth endpoints return proper error structure
    endpoints_and_data = [
        ("/auth/signup/email", {"email": "test@test.com", "password": "short", "name": "Test"}),
        ("/auth/login/email", {"email": "nonexistent@test.com", "password": "wrong"}),
        ("/auth/refresh", {"refresh_token": "invalid"}),
        ("/auth/token/verify", {"access_token": "invalid"}),
        ("/auth/password/reset/request", {"email": "invalid-email"}),
        ("/auth/password/reset/confirm", {"reset_token": "invalid", "new_password": "short"})
    ]
    
    for endpoint, data in endpoints_and_data:
        response = client.post(endpoint, json=data)
        
        # Should not expose internal server details
        if response.status_code >= 400:
            response_data = response.json()
            assert "detail" in response_data
            # Should not contain stack traces or internal paths
            detail_str = str(response_data["detail"]).lower()
            assert "traceback" not in detail_str
            assert "exception" not in detail_str
            assert "/app/" not in detail_str


@pytest.mark.asyncio
async def test_authentication_rate_limiting_simulation(client: TestClient):
    """Simulate rate limiting scenarios"""
    
    # Test multiple failed login attempts
    login_data = {"email": "nonexistent@example.com", "password": "wrongpassword"}
    
    failed_attempts = []
    for i in range(5):
        response = client.post("/auth/login/email", json=login_data)
        failed_attempts.append(response.status_code)
    
    # All should fail with 401 (no actual rate limiting implemented yet)
    assert all(status == 401 for status in failed_attempts)


@pytest.mark.asyncio
async def test_user_data_consistency_across_endpoints(client: TestClient, db):
    """Test that user data is consistent across different auth endpoints"""
    
    # Create user
    signup_data = {
        "email": "consistency_test@example.com",
        "password": "password123", 
        "name": "Consistency Test User"
    }
    signup_response = client.post("/auth/signup/email", json=signup_data)
    signup_user = signup_response.json()["user"]
    
    # Login and check user data consistency
    login_response = client.post("/auth/login/email", json={
        "email": signup_data["email"],
        "password": signup_data["password"]
    })
    login_user = login_response.json()["user"]
    
    # Verify token and check user data consistency
    access_token = login_response.json()["access_token"]
    verify_response = client.post("/auth/token/verify", json={"access_token": access_token})
    verify_user = verify_response.json()
    
    # All user data should be identical
    assert signup_user["id"] == login_user["id"] == verify_user["id"]
    assert signup_user["email"] == login_user["email"] == verify_user["email"] 
    assert signup_user["name"] == login_user["name"] == verify_user["name"]


@pytest.mark.asyncio
async def test_token_expiration_edge_cases(client: TestClient, db):
    """Test edge cases around token expiration"""
    
    # Create user and get tokens
    signup_response = client.post("/auth/signup/email", json={
        "email": "token_expiry_test@example.com",
        "password": "password123",
        "name": "Token Expiry Test"
    })
    access_token = signup_response.json()["access_token"]
    
    # Verify token is initially valid
    verify_response = client.post("/auth/token/verify", json={"access_token": access_token})
    assert verify_response.status_code == 200
    
    # Test with a manually crafted expired token
    from app.auth.security import create_access_token
    from datetime import timedelta
    
    # Create an expired token (expired 1 second ago)
    expired_token = create_access_token(
        data={"sub": signup_response.json()["user"]["id"]},
        expires_delta=timedelta(seconds=-1)
    )
    
    expired_verify_response = client.post("/auth/token/verify", json={"access_token": expired_token})
    assert expired_verify_response.status_code == 401
    assert "expired" in expired_verify_response.json()["detail"].lower()
