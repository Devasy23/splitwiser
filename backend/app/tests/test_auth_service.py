import pytest
from fastapi import HTTPException
from app.auth.service import AuthService
from app.auth.schemas import UserResponse # Assuming this is used or relevant for response assertions
from unittest.mock import patch, AsyncMock, MagicMock # For mocking async methods if needed
from datetime import datetime, timedelta # Ensure timedelta is imported
import firebase_admin.auth
from bson import ObjectId # Add this import
from jose import jwt # For crafting a token with a wrong secret

from app.auth.security import create_access_token
from app.config import settings

# You might need to adjust imports based on your project structure
# and the fixtures defined in conftest.py

@pytest.mark.asyncio
async def test_create_user_with_email_success(auth_service_mocked: AuthService, db):
    email = "test@example.com"
    password = "password123"
    name = "Test User"

    result = await auth_service_mocked.create_user_with_email(email, password, name)

    assert "user" in result
    assert "refresh_token" in result
    assert result["user"]["email"] == email
    assert result["user"]["name"] == name
    assert "_id" in result["user"] # Check if _id is assigned

    # Verify user is in the database
    user_in_db = await db.users.find_one({"email": email})
    assert user_in_db is not None
    assert user_in_db["name"] == name
    assert "hashed_password" in user_in_db

    # Verify refresh token is in the database
    refresh_token_in_db = await db.refresh_tokens.find_one({"user_id": user_in_db["_id"]})
    assert refresh_token_in_db is not None
    assert refresh_token_in_db["token"] == result["refresh_token"]

@pytest.mark.asyncio
async def test_create_user_with_email_duplicate(auth_service_mocked: AuthService, db):
    email = "existing@example.com"
    password = "password123"
    name = "Existing User"

    # Create the user first
    await auth_service_mocked.create_user_with_email(email, password, name)

    # Attempt to create the same user again
    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.create_user_with_email(email, "anotherpassword", "Another Name")

    assert excinfo.value.status_code == 400
    assert "already exists" in str(excinfo.value.detail).lower()

    # Verify only one user with that email exists
    count = await db.users.count_documents({"email": email})
    assert count == 1

@pytest.mark.asyncio
async def test_authenticate_user_with_email_success(auth_service_mocked: AuthService, db):
    email = "auth_test@example.com"
    password = "password123"
    name = "Auth Test User"

    # Create user first
    await auth_service_mocked.create_user_with_email(email, password, name)

    # Authenticate user
    result = await auth_service_mocked.authenticate_user_with_email(email, password)

    assert "user" in result
    assert "refresh_token" in result
    assert result["user"]["email"] == email
    assert result["user"]["name"] == name

    # Verify new refresh token is in the database
    user_in_db = await db.users.find_one({"email": email})
    assert user_in_db is not None # Ensure user was found

    refresh_token_in_db = await db.refresh_tokens.find_one({
        "user_id": user_in_db["_id"],
        "token": result["refresh_token"],
        "revoked": False # New token should not be revoked
    })
    assert refresh_token_in_db is not None

@pytest.mark.asyncio
async def test_authenticate_user_with_email_incorrect_password(auth_service_mocked: AuthService, db):
    email = "auth_wrong_pass@example.com"
    password = "password123"
    name = "Auth Wrong Pass"

    # Create user first
    await auth_service_mocked.create_user_with_email(email, password, name)

    # Attempt to authenticate with incorrect password
    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.authenticate_user_with_email(email, "wrongpassword")

    assert excinfo.value.status_code == 401
    assert "incorrect email or password" in str(excinfo.value.detail).lower()


@pytest.mark.asyncio
async def test_create_refresh_token_record(auth_service_mocked: AuthService, db):
    # 1. Create a dummy user directly in DB for this test, as we only need a user_id
    user_email = "refreshtokenuser@example.com"
    user_doc = {
        "email": user_email,
        "name": "RefreshToken User",
        "hashed_password": "somehash",
        "created_at": datetime.utcnow()
    }
    insert_result = await db.users.insert_one(user_doc)
    user_id_obj = insert_result.inserted_id
    user_id_str = str(user_id_obj)

    # 2. Call _create_refresh_token_record with string user_id
    refresh_token_str_id = await auth_service_mocked._create_refresh_token_record(user_id_str)
    assert refresh_token_str_id is not None
    assert isinstance(refresh_token_str_id, str)

    # 3. Verify the token record in the database for string user_id input
    token_record_str_id = await db.refresh_tokens.find_one({"token": refresh_token_str_id})
    assert token_record_str_id is not None
    assert token_record_str_id["user_id"] == user_id_obj # Should be stored as ObjectId
    assert not token_record_str_id["revoked"]
    assert "expires_at" in token_record_str_id
    assert token_record_str_id["expires_at"] > datetime.utcnow()
    # Check if expiry is roughly correct (e.g., within a few seconds of expected)
    expected_expiry = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    assert abs((token_record_str_id["expires_at"] - expected_expiry).total_seconds()) < 5 # Allow 5s diff

    # 4. Call _create_refresh_token_record with ObjectId user_id
    refresh_token_obj_id = await auth_service_mocked._create_refresh_token_record(user_id_obj)
    assert refresh_token_obj_id is not None
    assert isinstance(refresh_token_obj_id, str)
    assert refresh_token_obj_id != refresh_token_str_id # Should be a new token

    # 5. Verify the token record in the database for ObjectId user_id input
    token_record_obj_id = await db.refresh_tokens.find_one({"token": refresh_token_obj_id})
    assert token_record_obj_id is not None
    assert token_record_obj_id["user_id"] == user_id_obj
    assert not token_record_obj_id["revoked"]
    assert "expires_at" in token_record_obj_id
    expected_expiry_obj = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    assert abs((token_record_obj_id["expires_at"] - expected_expiry_obj).total_seconds()) < 5


@pytest.mark.asyncio
async def test_confirm_password_reset_success(auth_service_mocked: AuthService, db):
    email = "confirm_reset@example.com"
    old_password = "oldPassword123"
    new_password = "newPassword456"
    name = "Confirm Reset User"

    # 1. Create user
    created_user_data = await auth_service_mocked.create_user_with_email(email, old_password, name)
    user_id_obj = ObjectId(created_user_data["user"]["_id"])

    # 2. Create a password reset token for this user (simulating request_password_reset)
    reset_token_value = "valid_reset_token_for_confirm"
    reset_expires = datetime.utcnow() + timedelta(hours=1)
    await db.password_resets.insert_one({
        "user_id": user_id_obj,
        "token": reset_token_value,
        "expires_at": reset_expires,
        "used": False,
        "created_at": datetime.utcnow()
    })

    # 3. Create some refresh tokens for this user
    await auth_service_mocked._create_refresh_token_record(str(user_id_obj))
    await auth_service_mocked._create_refresh_token_record(str(user_id_obj))

    # 4. Confirm password reset
    result = await auth_service_mocked.confirm_password_reset(reset_token_value, new_password)
    assert result is True

    # 5. Verify password was updated in DB
    user_in_db = await db.users.find_one({"_id": user_id_obj})
    assert user_in_db is not None
    # To verify password, we'd need to compare hashes or use verify_password.
    # auth_service.authenticate_user_with_email would do this.
    # Let's try authenticating with the new password.
    try:
        await auth_service_mocked.authenticate_user_with_email(email, new_password)
    except HTTPException as e:
        pytest.fail(f"Authentication with new password failed: {e.detail}")

    # Ensure old password no longer works
    with pytest.raises(HTTPException) as excinfo_old_pass:
        await auth_service_mocked.authenticate_user_with_email(email, old_password)
    assert excinfo_old_pass.value.status_code == 401


    # 6. Verify reset token was marked as used
    reset_record = await db.password_resets.find_one({"token": reset_token_value})
    assert reset_record is not None
    assert reset_record["used"] is True

    # 7. Verify all refresh tokens for the user were revoked
    refresh_tokens_count = await db.refresh_tokens.count_documents({"user_id": user_id_obj, "revoked": False})
    assert refresh_tokens_count == 0

    all_refresh_tokens_count = await db.refresh_tokens.count_documents({"user_id": user_id_obj})
    assert all_refresh_tokens_count > 0 # Make sure there were tokens to revoke

@pytest.mark.asyncio
async def test_confirm_password_reset_invalid_token(auth_service_mocked: AuthService, db):
    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.confirm_password_reset("invalid_reset_token", "newPassword123")

    assert excinfo.value.status_code == 400
    assert "invalid or expired reset token" in str(excinfo.value.detail).lower()

@pytest.mark.asyncio
async def test_confirm_password_reset_expired_token(auth_service_mocked: AuthService, db):
    email = "confirm_reset_expired@example.com"
    password = "password123"
    name = "Confirm Reset Expired"
    new_password = "newPassword456"

    created_user_data = await auth_service_mocked.create_user_with_email(email, password, name)
    user_id_obj = ObjectId(created_user_data["user"]["_id"])

    reset_token_value = "expired_reset_token_for_confirm"
    # Token expired yesterday
    reset_expires = datetime.utcnow() - timedelta(days=1)
    await db.password_resets.insert_one({
        "user_id": user_id_obj,
        "token": reset_token_value,
        "expires_at": reset_expires,
        "used": False,
        "created_at": datetime.utcnow() - timedelta(days=1, hours=1) # created before expiry
    })

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.confirm_password_reset(reset_token_value, new_password)

    assert excinfo.value.status_code == 400
    assert "invalid or expired reset token" in str(excinfo.value.detail).lower()

@pytest.mark.asyncio
async def test_confirm_password_reset_token_already_used(auth_service_mocked: AuthService, db):
    email = "confirm_reset_used@example.com"
    password = "password123"
    name = "Confirm Reset Used"
    new_password = "newPassword456"

    created_user_data = await auth_service_mocked.create_user_with_email(email, password, name)
    user_id_obj = ObjectId(created_user_data["user"]["_id"])

    reset_token_value = "used_reset_token_for_confirm"
    reset_expires = datetime.utcnow() + timedelta(hours=1)
    await db.password_resets.insert_one({
        "user_id": user_id_obj,
        "token": reset_token_value,
        "expires_at": reset_expires,
        "used": True, # Mark as already used
        "created_at": datetime.utcnow()
    })

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.confirm_password_reset(reset_token_value, new_password)

    assert excinfo.value.status_code == 400
    assert "invalid or expired reset token" in str(excinfo.value.detail).lower()


@pytest.mark.asyncio
async def test_request_password_reset_existing_user(auth_service_mocked: AuthService, db):
    email = "reset_pass_existing@example.com"
    password = "password123"
    name = "Reset Pass Existing"

    # 1. Create a user
    created_user_data = await auth_service_mocked.create_user_with_email(email, password, name)
    user_id_obj = ObjectId(created_user_data["user"]["_id"])

    # 2. Request password reset
    # The method prints the token in service, we can optionally capture stdout or mock 'print'
    # For now, we'll just check the DB.
    with patch('builtins.print') as mock_print: # Mock print to avoid console output during tests
        result = await auth_service_mocked.request_password_reset(email)

    assert result is True # Method should return True

    # 3. Verify password reset token is in the database
    reset_record = await db.password_resets.find_one({"user_id": user_id_obj})
    assert reset_record is not None
    assert "token" in reset_record
    assert "expires_at" in reset_record
    assert not reset_record["used"]

    # Check if print was called (optional, but good to ensure the dev part of code is hit)
    assert mock_print.call_count >= 1 # At least one print call for token and link

@pytest.mark.asyncio
async def test_request_password_reset_non_existent_user(auth_service_mocked: AuthService, db):
    email = "reset_pass_nonexistent@example.com"

    # 1. Request password reset for an email not in the DB
    with patch('builtins.print') as mock_print:
        result = await auth_service_mocked.request_password_reset(email)

    assert result is True # Method should still return True to not reveal email existence

    # 2. Verify no password reset token was created (as no user matches)
    # This check depends on how you want to interpret "no user matches".
    # The current implementation *would* not find a user, so no record.
    # We need to find a user_id to check. Since there's no user, there's no user_id.
    # So we check that the count of password_resets remains 0 or unchanged if other tests made some.

    # Let's count records for any user, if any were made for this email (they shouldn't be)
    # Since we don't have a user_id, we can't directly query.
    # The service logic is: find user by email. If not user, return True. No DB write for password_resets.
    # So, the count of password_resets documents should not increase for a non-existent user.

    # To be more specific, we can check that no document in password_resets could be linked to this email.
    # This is tricky without a user_id.
    # The most straightforward is to ensure the count of documents in password_resets hasn't changed
    # or, if it's the first test of its kind, that it's 0.
    # Let's assume this test runs in an environment where we can count.

    # A better way: check that no reset token was printed for this specific email.
    # This requires inspecting mock_print.call_args if it was called.
    # However, the service code only prints if a user IS found. So mock_print shouldn't be called.
    assert mock_print.call_count == 0


    # Ensure no reset token was added to the db.
    # This is an indirect check, if there were other reset tokens, this wouldn't be specific enough.
    # For a truly isolated test, you'd clear password_resets before this or ensure it's empty.
    # Given our db fixture cleans up, password_resets should be empty before this test.
    count = await db.password_resets.count_documents({})
    assert count == 0 # No new reset tokens should be added.


@pytest.mark.asyncio
async def test_verify_access_token_success(auth_service_mocked: AuthService, db):
    email = "verify_token@example.com"
    password = "password123"
    name = "Verify Token User"

    # 1. Create a user
    created_user_data = await auth_service_mocked.create_user_with_email(email, password, name)
    user_id_str = created_user_data["user"]["_id"]

    # 2. Create an access token for this user
    # Make sure settings are loaded for create_access_token to use secret_key and algorithm
    # The conftest.py should ideally handle settings initialization if needed globally
    access_token = create_access_token(data={"sub": user_id_str})

    # 3. Verify the access token
    verified_user_data = await auth_service_mocked.verify_access_token(access_token)

    assert verified_user_data is not None
    assert str(verified_user_data["_id"]) == user_id_str # verify_access_token returns the user doc
    assert verified_user_data["email"] == email

@pytest.mark.asyncio
async def test_verify_access_token_invalid_signature(auth_service_mocked: AuthService, db):
    # Create a token with a different key to make it invalid
    invalid_token = jwt.encode({"sub": "some_id", "exp": datetime.utcnow() + timedelta(minutes=15)}, "wrongsecret", algorithm=settings.algorithm)

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.verify_access_token(invalid_token)

    assert excinfo.value.status_code == 401
    assert "could not validate credentials" in str(excinfo.value.detail).lower() # This is the message from security.verify_token

@pytest.mark.asyncio
async def test_verify_access_token_expired(auth_service_mocked: AuthService, db):
    user_id_str = "some_user_id_for_expired_token"
    # Create user so that verify_access_token can find it if token was valid
    # This step is important because verify_access_token also fetches the user from DB
    await db.users.insert_one({
        "_id": ObjectId(user_id_str), "email": "expired@example.com", "name": "Expired User",
        "hashed_password": "abc", "created_at": datetime.utcnow()
    })

    expired_access_token = create_access_token(
        data={"sub": user_id_str},
        expires_delta=timedelta(minutes=-5) # Negative delta to make it expired
    )

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.verify_access_token(expired_access_token)

    assert excinfo.value.status_code == 401
    # The detail comes from security.verify_token's JWTError
    assert "could not validate credentials" in str(excinfo.value.detail).lower() # Or "Token has expired" depending on JWT library specifics

@pytest.mark.asyncio
async def test_verify_access_token_no_sub(auth_service_mocked: AuthService, db):
    # Token without 'sub' field
    token_no_sub = create_access_token(data={}) # No 'sub'

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.verify_access_token(token_no_sub)

    assert excinfo.value.status_code == 401
    # This message comes from verify_access_token service method
    assert "invalid token" in str(excinfo.value.detail).lower()

@pytest.mark.asyncio
async def test_verify_access_token_user_not_found_in_db(auth_service_mocked: AuthService, db):
    user_id_str = "non_existent_user_id"
    # Token for a user that does not exist in the DB
    access_token = create_access_token(data={"sub": user_id_str})

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.verify_access_token(access_token)

    assert excinfo.value.status_code == 401
    # This message comes from verify_access_token service method
    assert "user not found" in str(excinfo.value.detail).lower()


@pytest.mark.asyncio
async def test_refresh_access_token_success(auth_service_mocked: AuthService, db):
    email = "refresh_test@example.com"
    password = "password123"
    name = "Refresh Test User"

    # 1. Create user
    created_user_data = await auth_service_mocked.create_user_with_email(email, password, name)
    original_refresh_token = created_user_data["refresh_token"]
    user_id_str = created_user_data["user"]["_id"]
    user_id_obj = ObjectId(user_id_str) # Convert to ObjectId

    # 2. Verify original token exists and is not revoked
    original_token_doc = await db.refresh_tokens.find_one({"token": original_refresh_token, "user_id": user_id_obj})
    assert original_token_doc is not None
    assert not original_token_doc["revoked"]

    # 3. Refresh the token
    new_refresh_token = await auth_service_mocked.refresh_access_token(original_refresh_token)
    assert new_refresh_token is not None
    assert new_refresh_token != original_refresh_token

    # 4. Verify old token is revoked
    old_token_doc_after_refresh = await db.refresh_tokens.find_one({"token": original_refresh_token, "user_id": user_id_obj})
    assert old_token_doc_after_refresh is not None
    assert old_token_doc_after_refresh["revoked"]

    # 5. Verify new token exists and is not revoked
    new_token_doc = await db.refresh_tokens.find_one({"token": new_refresh_token, "user_id": user_id_obj})
    assert new_token_doc is not None
    assert not new_token_doc["revoked"]

@pytest.mark.asyncio
async def test_refresh_access_token_invalid_token(auth_service_mocked: AuthService, db):
    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.refresh_access_token("invalid_dummy_token")

    assert excinfo.value.status_code == 401
    assert "invalid or expired refresh token" in str(excinfo.value.detail).lower()

@pytest.mark.asyncio
async def test_refresh_access_token_expired_token(auth_service_mocked: AuthService, db):
    email = "expired_refresh@example.com"
    password = "password123"
    name = "Expired Refresh User"

    created_user_data = await auth_service_mocked.create_user_with_email(email, password, name)
    expired_refresh_token = created_user_data["refresh_token"]
    user_id_str = created_user_data["user"]["_id"]
    user_id_obj = ObjectId(user_id_str) # Convert to ObjectId

    # Manually expire the token in the mock DB
    await db.refresh_tokens.update_one(
        {"token": expired_refresh_token, "user_id": user_id_obj},
        {"$set": {"expires_at": datetime.utcnow() - timedelta(days=1)}}
    )

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.refresh_access_token(expired_refresh_token)

    assert excinfo.value.status_code == 401
    assert "invalid or expired refresh token" in str(excinfo.value.detail).lower()

@pytest.mark.asyncio
async def test_refresh_access_token_revoked_token(auth_service_mocked: AuthService, db):
    email = "revoked_refresh@example.com"
    password = "password123"
    name = "Revoked Refresh User"

    created_user_data = await auth_service_mocked.create_user_with_email(email, password, name)
    revoked_refresh_token = created_user_data["refresh_token"]
    user_id_str = created_user_data["user"]["_id"]
    user_id_obj = ObjectId(user_id_str) # Convert to ObjectId

    # Manually revoke the token
    await db.refresh_tokens.update_one(
        {"token": revoked_refresh_token, "user_id": user_id_obj},
        {"$set": {"revoked": True}}
    )

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.refresh_access_token(revoked_refresh_token)

    assert excinfo.value.status_code == 401
    assert "invalid or expired refresh token" in str(excinfo.value.detail).lower() # The error message is the same for invalid, expired or revoked

@pytest.mark.asyncio
async def test_refresh_access_token_user_not_found(auth_service_mocked: AuthService, db):
    # Create a token but then delete the user
    email = "user_gone@example.com"
    password = "password123"
    name = "User Gone"

    created_user_data = await auth_service_mocked.create_user_with_email(email, password, name)
    token_for_deleted_user = created_user_data["refresh_token"]
    user_id_str = created_user_data["user"]["_id"]
    user_id_obj = ObjectId(user_id_str) # Convert to ObjectId

    # Ensure token is valid before deleting user
    token_doc = await db.refresh_tokens.find_one({"token": token_for_deleted_user, "user_id": user_id_obj})
    assert token_doc is not None
    assert not token_doc["revoked"]

    # Delete the user
    await db.users.delete_one({"_id": user_id_obj})

    # Attempt to refresh token for the now non-existent user
    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.refresh_access_token(token_for_deleted_user)

    assert excinfo.value.status_code == 401
    assert "user not found" in str(excinfo.value.detail).lower()


@pytest.mark.asyncio
@patch('app.auth.service.firebase_auth.verify_id_token')
async def test_authenticate_with_google_new_user(mock_verify_id_token, auth_service_mocked: AuthService, db):
    id_token = "mock_google_id_token_new_user"
    firebase_uid = "firebase_uid_new"
    email = "google_new@example.com"
    name = "Google New User"
    picture = "http://example.com/new_avatar.jpg"

    mock_verify_id_token.return_value = {
        'uid': firebase_uid,
        'email': email,
        'name': name,
        'picture': picture
    }

    result = await auth_service_mocked.authenticate_with_google(id_token)

    assert "user" in result
    assert "refresh_token" in result
    assert result["user"]["email"] == email
    assert result["user"]["name"] == name
    assert result["user"]["avatar"] == picture
    assert result["user"]["firebase_uid"] == firebase_uid
    assert result["user"]["auth_provider"] == "google"

    mock_verify_id_token.assert_called_once_with(id_token)

    user_in_db = await db.users.find_one({"email": email})
    assert user_in_db is not None
    assert user_in_db["name"] == name
    assert user_in_db["firebase_uid"] == firebase_uid

    refresh_token_in_db = await db.refresh_tokens.find_one({"user_id": user_in_db["_id"], "token": result["refresh_token"]})
    assert refresh_token_in_db is not None

@pytest.mark.asyncio
@patch('app.auth.service.firebase_auth.verify_id_token')
async def test_authenticate_with_google_existing_user(mock_verify_id_token, auth_service_mocked: AuthService, db):
    id_token = "mock_google_id_token_existing_user"
    firebase_uid = "firebase_uid_existing"
    email = "google_existing@example.com"
    name = "Google Existing User"
    initial_picture = "http://example.com/initial_avatar.jpg"
    updated_picture = "http://example.com/updated_avatar.jpg"

    # Pre-create user (e.g., signed up via email first, or previous Google login)
    existing_user_doc = {
        "email": email,
        "name": name, # Name might be different initially
        "avatar": initial_picture,
        "currency": "USD",
        "created_at": datetime.utcnow(), # Import datetime
        "auth_provider": "email", # Initially email
        "firebase_uid": None # No Firebase UID initially
    }
    await db.users.insert_one(existing_user_doc)
    # Re-fetch to get ObjectId correctly
    existing_user_in_db = await db.users.find_one({"email": email})
    assert existing_user_in_db is not None


    mock_verify_id_token.return_value = {
        'uid': firebase_uid, # New Firebase UID
        'email': email,
        'name': name, # Name might be updated from Google
        'picture': updated_picture # Avatar might be updated
    }

    result = await auth_service_mocked.authenticate_with_google(id_token)

    assert result["user"]["email"] == email
    assert result["user"]["name"] == name # Assuming name from Google is preferred
    assert result["user"]["avatar"] == updated_picture # Avatar updated
    assert result["user"]["firebase_uid"] == firebase_uid # Firebase UID updated
    assert result["user"]["auth_provider"] == "email" # Auth provider might remain original or be updated based on logic

    mock_verify_id_token.assert_called_once_with(id_token)

    user_in_db_after_auth = await db.users.find_one({"email": email})
    assert user_in_db_after_auth is not None
    assert user_in_db_after_auth["avatar"] == updated_picture
    assert user_in_db_after_auth["firebase_uid"] == firebase_uid

    refresh_token_in_db = await db.refresh_tokens.find_one({"user_id": user_in_db_after_auth["_id"], "token": result["refresh_token"]})
    assert refresh_token_in_db is not None

@pytest.mark.asyncio
@patch('app.auth.service.firebase_auth.verify_id_token')
async def test_authenticate_with_google_invalid_token(mock_verify_id_token, auth_service_mocked: AuthService):
    id_token = "invalid_google_id_token"

    # Import firebase_admin.auth for the exception type
    # import firebase_admin.auth # Already imported at the top
    mock_verify_id_token.side_effect = firebase_admin.auth.InvalidIdTokenError("Invalid token")

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.authenticate_with_google(id_token)

    assert excinfo.value.status_code == 401
    assert "invalid google id token" in str(excinfo.value.detail).lower()
    mock_verify_id_token.assert_called_once_with(id_token)

@pytest.mark.asyncio
@patch('app.auth.service.firebase_auth.verify_id_token')
async def test_authenticate_with_google_missing_email(mock_verify_id_token, auth_service_mocked: AuthService):
    id_token = "mock_google_id_token_no_email"
    firebase_uid = "firebase_uid_no_email"
    name = "Google No Email User"

    mock_verify_id_token.return_value = {
        'uid': firebase_uid,
        'name': name,
        # Email is missing
    }

    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.authenticate_with_google(id_token)

    assert excinfo.value.status_code == 400
    assert "email not provided by google" in str(excinfo.value.detail).lower()
    mock_verify_id_token.assert_called_once_with(id_token)

@pytest.mark.asyncio
async def test_authenticate_user_with_email_non_existent_user(auth_service_mocked: AuthService, db):
    email = "nonexistent@example.com"
    password = "password123"

    # Attempt to authenticate non-existent user
    with pytest.raises(HTTPException) as excinfo:
        await auth_service_mocked.authenticate_user_with_email(email, password)

    assert excinfo.value.status_code == 401
    assert "incorrect email or password" in str(excinfo.value.detail).lower()
