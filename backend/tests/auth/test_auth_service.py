from pymongo.errors import DuplicateKeyError
import logging
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.auth.security import create_refresh_token, get_password_hash, verify_password
from app.auth.service import AuthService
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from firebase_admin import auth as firebase_auth
from jose import JWTError
from pymongo.errors import PyMongoError


def validate_object_id(id_str: str, field_name: str = "ID") -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid {field_name}"
        )


async def test_create_user_with_email_success(monkeypatch):
    service = AuthService()

    # Mock DB behavior
    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = None  # No existing user
    mock_insert_result = AsyncMock(inserted_id=ObjectId())
    mock_db.users.insert_one.return_value = mock_insert_result

    monkeypatch.setattr(service, "get_db", lambda: mock_db)
    monkeypatch.setattr(
        service,
        "_create_refresh_token_record",
        AsyncMock(return_value="mock_refresh_token"),
    )
    monkeypatch.setattr(
        "app.auth.service.get_password_hash", lambda pwd: f"hashed_{pwd}"
    )

    result = await service.create_user_with_email(
        "new@example.com", "securepass", "Test User"
    )

    assert result["user"]["email"] == "new@example.com"
    assert result["user"]["hashed_password"] == "hashed_securepass"
    assert result["refresh_token"] == "mock_refresh_token"


@pytest.mark.asyncio
async def test_create_user_with_email_already_exists(monkeypatch):
    service = AuthService()

    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = {"email": "existing@example.com"}

    monkeypatch.setattr(service, "get_db", lambda: mock_db)

    with pytest.raises(HTTPException) as exc:
        await service.create_user_with_email("existing@example.com", "pass", "User")

    assert exc.value.status_code == 400
    assert exc.value.detail == "User with this email already exists"


@pytest.mark.asyncio
async def test_create_user_with_email_refresh_token_error(monkeypatch):
    service = AuthService()

    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = None
    mock_insert_result = AsyncMock(inserted_id=ObjectId())
    mock_db.users.insert_one.return_value = mock_insert_result

    monkeypatch.setattr(service, "get_db", lambda: mock_db)
    monkeypatch.setattr(
        "app.auth.service.get_password_hash", lambda pwd: f"hashed_{pwd}"
    )

    async def fail_refresh_token(*args, **kwargs):
        raise Exception("Token generation failed")

    monkeypatch.setattr(
        service, "_create_refresh_token_record", fail_refresh_token)

    with pytest.raises(HTTPException) as exc:
        await service.create_user_with_email("fail@example.com", "pass", "User")

    assert exc.value.status_code == 500
    assert exc.value.detail == "Internal server error"


@pytest.mark.asyncio
async def test_create_user_with_email_duplicate_key(monkeypatch):
    service = AuthService()

    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = None
    mock_db.users.insert_one.side_effect = DuplicateKeyError("dup key")

    monkeypatch.setattr(service, "get_db", lambda: mock_db)
    monkeypatch.setattr(
        "app.auth.service.get_password_hash", lambda pwd: f"hashed_{pwd}"
    )
    monkeypatch.setattr(service, "_create_refresh_token_record", AsyncMock())

    with pytest.raises(HTTPException) as exc:
        await service.create_user_with_email("race@example.com", "pass", "User")

    assert exc.value.status_code == 400
    assert exc.value.detail == "User with this email already exists"


@pytest.mark.asyncio
async def test_authenticate_user_success(monkeypatch):
    service = AuthService()
    mock_user = {
        "_id": ObjectId(),
        "email": "test@example.com",
        "hashed_password": "mocked_hash",
    }

    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = mock_user

    monkeypatch.setattr(service, "get_db", lambda: mock_db)
    monkeypatch.setattr(
        "app.auth.service.verify_password", lambda pwd, hash: pwd == "correct-password"
    )
    monkeypatch.setattr(
        service, "_create_refresh_token_record", AsyncMock(
            return_value="refresh-token")
    )

    result = await service.authenticate_user_with_email(
        "test@example.com", "correct-password"
    )

    assert result.get("user") == mock_user
    assert result.get("refresh_token") == "refresh-token"


@pytest.mark.asyncio
async def test_authenticate_user_db_error(monkeypatch):
    service = AuthService()
    mock_db = AsyncMock()
    mock_db.users.find_one.side_effect = PyMongoError("DB failure")

    monkeypatch.setattr(service, "get_db", lambda: mock_db)

    with pytest.raises(HTTPException) as e:
        await service.authenticate_user_with_email("email", "pass")

    assert e.value.status_code == 500
    assert "Internal server error" in e.value.detail


@pytest.mark.asyncio
async def test_authenticate_user_not_found(monkeypatch):
    service = AuthService()
    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = None

    monkeypatch.setattr(service, "get_db", lambda: mock_db)

    with pytest.raises(HTTPException) as e:
        await service.authenticate_user_with_email("email", "pass")

    assert e.value.status_code == 401
    assert "Incorrect email or password" in e.value.detail


@pytest.mark.asyncio
async def test_authenticate_user_password_incorrect(monkeypatch):
    service = AuthService()
    mock_user = {
        "_id": ObjectId(),
        "email": "test@example.com",
        "hashed_password": "hashed",
    }

    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = mock_user

    monkeypatch.setattr(service, "get_db", lambda: mock_db)
    monkeypatch.setattr("app.auth.service.verify_password",
                        lambda pwd, hash: False)

    with pytest.raises(HTTPException) as e:
        await service.authenticate_user_with_email("email", "wrongpass")

    assert e.value.status_code == 401
    assert "Incorrect email or password" in e.value.detail


@pytest.mark.asyncio
async def test_authenticate_user_missing_hashed_password(monkeypatch):
    service = AuthService()
    # no hashed_password
    mock_user = {"_id": ObjectId(), "email": "test@example.com"}

    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = mock_user

    monkeypatch.setattr(service, "get_db", lambda: mock_db)
    monkeypatch.setattr("app.auth.service.verify_password",
                        lambda pwd, hash: False)

    with pytest.raises(HTTPException) as e:
        await service.authenticate_user_with_email("email", "pass")

    assert e.value.status_code == 401


@pytest.mark.asyncio
async def test_authenticate_user_refresh_token_error(monkeypatch):
    service = AuthService()
    mock_user = {
        "_id": ObjectId(),
        "email": "test@example.com",
        "hashed_password": "mocked_hash",
    }

    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = mock_user

    monkeypatch.setattr(service, "get_db", lambda: mock_db)
    monkeypatch.setattr("app.auth.service.verify_password",
                        lambda pwd, hash: True)
    monkeypatch.setattr(
        service,
        "_create_refresh_token_record",
        AsyncMock(side_effect=Exception("fail")),
    )

    with pytest.raises(HTTPException) as e:
        await service.authenticate_user_with_email("email", "pass")

    assert e.value.status_code == 500
    assert "Failed to generate refresh token" in e.value.detail


@pytest.mark.asyncio
async def test_authenticate_with_google_success(mocker):
    mock_token = "valid-id-token"
    mock_user_id = ObjectId()
    decoded_token = {
        "uid": "firebase-uid-123",
        "email": "test@example.com",
        "name": "Test User",
        "picture": "http://example.com/avatar.jpg",
    }

    # Mock firebase_auth.verify_id_token
    mocker.patch(
        "app.auth.service.firebase_auth.verify_id_token", return_value=decoded_token
    )

    # Mock db
    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = None  # Simulate new user
    mock_db.users.insert_one.return_value.inserted_id = mock_user_id

    mocker.patch.object(AuthService, "get_db", return_value=mock_db)
    mocker.patch.object(
        AuthService, "_create_refresh_token_record", return_value="new_refresh_token"
    )

    service = AuthService()
    result = await service.authenticate_with_google(mock_token)

    assert result["user"]["email"] == "test@example.com"
    assert result["refresh_token"] == "new_refresh_token"


@pytest.mark.asyncio
async def test_authenticate_with_google_invalid_token(mocker):
    mocker.patch(
        "app.auth.service.firebase_auth.verify_id_token",
        side_effect=firebase_auth.InvalidIdTokenError("bad token"),
    )

    service = AuthService()
    with pytest.raises(HTTPException) as exc_info:
        await service.authenticate_with_google("invalid-token")

    assert exc_info.value.status_code == 401
    assert "Invalid Google ID token" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_authenticate_with_google_missing_email(mocker):

    decoded_token = {"uid": "uid123"}  # no email

    mocker.patch(
        "app.auth.service.firebase_auth.verify_id_token", return_value=decoded_token
    )

    service = AuthService()
    with pytest.raises(HTTPException) as exc_info:
        await service.authenticate_with_google("any")

    assert exc_info.value.status_code == 400
    assert "Email not provided" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_authenticate_with_google_db_find_error(mocker):
    decoded_token = {"uid": "uid123", "email": "test@example.com"}

    mocker.patch(
        "app.auth.service.firebase_auth.verify_id_token", return_value=decoded_token
    )

    mock_db = AsyncMock()
    mock_db.users.find_one.side_effect = PyMongoError("db error")
    mocker.patch.object(AuthService, "get_db", return_value=mock_db)

    service = AuthService()
    with pytest.raises(HTTPException) as exc_info:
        await service.authenticate_with_google("any")

    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_authenticate_with_google_insert_error(mocker):
    decoded_token = {
        "uid": "uid123",
        "email": "test@example.com",
    }

    mocker.patch(
        "app.auth.service.firebase_auth.verify_id_token", return_value=decoded_token
    )

    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = None
    mock_db.users.insert_one.side_effect = PyMongoError("insert failed")
    mocker.patch.object(AuthService, "get_db", return_value=mock_db)

    service = AuthService()
    with pytest.raises(HTTPException) as exc_info:
        await service.authenticate_with_google("token")

    assert exc_info.value.status_code == 500
    assert "Failed to create user" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_refresh_access_token_success():
    service = AuthService()
    mock_db = MagicMock()
    service.get_db = MagicMock(return_value=mock_db)

    now = datetime.now(timezone.utc)
    mock_token_record = {
        "token": "valid_refresh_token",
        "revoked": False,
        "expires_at": now + timedelta(hours=1),
        "user_id": "user123",
        "_id": "token_id",
    }
    mock_user = {"_id": "user123", "email": "test@example.com"}

    mock_db.refresh_tokens.find_one = AsyncMock(return_value=mock_token_record)
    mock_db.users.find_one = AsyncMock(return_value=mock_user)
    mock_db.refresh_tokens.update_one = AsyncMock()

    service._create_refresh_token_record = AsyncMock(
        return_value="new_refresh_token")

    token = await service.refresh_access_token("valid_refresh_token")
    assert token == "new_refresh_token"
    mock_db.refresh_tokens.update_one.assert_called_once()


@pytest.mark.asyncio
async def test_refresh_access_token_invalid_or_expired():
    service = AuthService()
    service.get_db = MagicMock(return_value=MagicMock())
    service.get_db().refresh_tokens.find_one = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as e:
        await service.refresh_access_token("invalid_or_expired_token")

    assert e.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid or expired" in e.value.detail


@pytest.mark.asyncio
async def test_refresh_access_token_user_not_found():
    service = AuthService()
    mock_db = MagicMock()
    service.get_db = MagicMock(return_value=mock_db)

    mock_token_record = {
        "token": "valid_token",
        "revoked": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "user_id": "user123",
    }

    mock_db.refresh_tokens.find_one = AsyncMock(return_value=mock_token_record)
    mock_db.users.find_one = AsyncMock(return_value=None)

    with pytest.raises(HTTPException) as e:
        await service.refresh_access_token("valid_token")

    assert e.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "User not found" in e.value.detail


@pytest.mark.asyncio
async def test_refresh_access_token_db_failure_on_token():
    service = AuthService()
    mock_db = MagicMock()
    service.get_db = MagicMock(return_value=mock_db)
    mock_db.refresh_tokens.find_one = AsyncMock(
        side_effect=PyMongoError("DB error"))

    with pytest.raises(HTTPException) as e:
        await service.refresh_access_token("any_token")

    assert e.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.asyncio
async def test_refresh_access_token_db_failure_on_user_fetch():
    service = AuthService()
    mock_db = MagicMock()
    service.get_db = MagicMock(return_value=mock_db)

    mock_token_record = {
        "token": "token",
        "revoked": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "user_id": "user123",
    }

    mock_db.refresh_tokens.find_one = AsyncMock(return_value=mock_token_record)
    mock_db.users.find_one = AsyncMock(side_effect=PyMongoError("DB error"))

    with pytest.raises(HTTPException) as e:
        await service.refresh_access_token("token")

    assert e.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.asyncio
async def test_refresh_access_token_generation_failure():
    service = AuthService()
    mock_db = MagicMock()
    service.get_db = MagicMock(return_value=mock_db)

    mock_token_record = {
        "token": "token",
        "revoked": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "user_id": "user123",
        "_id": "token_id",
    }

    mock_user = {"_id": "user123"}
    mock_db.refresh_tokens.find_one = AsyncMock(return_value=mock_token_record)
    mock_db.users.find_one = AsyncMock(return_value=mock_user)

    service._create_refresh_token_record = AsyncMock(
        side_effect=Exception("Token gen fail")
    )

    with pytest.raises(HTTPException) as e:
        await service.refresh_access_token("token")

    assert e.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "Failed to create refresh token" in e.value.detail


@pytest.mark.asyncio
async def test_verify_access_token_valid(monkeypatch):
    service = AuthService()

    # Mock verify_token to return a payload
    monkeypatch.setattr(
        "app.auth.security.verify_token", lambda token: {"sub": "user123"}
    )

    # Mock DB response
    mock_user = {"_id": "user123", "email": "test@example.com"}
    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = mock_user
    monkeypatch.setattr(service, "get_db", lambda: mock_db)

    user = await service.verify_access_token("validtoken")
    assert user == mock_user


@pytest.mark.asyncio
async def test_verify_access_token_invalid_token(monkeypatch):
    service = AuthService()

    def raise_jwt_error(token):
        raise JWTError("Invalid signature")

    monkeypatch.setattr("app.auth.security.verify_token", raise_jwt_error)

    with pytest.raises(HTTPException) as exc_info:
        await service.verify_access_token("badtoken")

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid token"


@pytest.mark.asyncio
async def test_verify_access_token_missing_sub(monkeypatch):
    service = AuthService()

    monkeypatch.setattr("app.auth.security.verify_token", lambda token: {})

    with pytest.raises(HTTPException) as exc_info:
        await service.verify_access_token("token")

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid token"


@pytest.mark.asyncio
async def test_verify_access_token_db_error(monkeypatch):
    service = AuthService()

    monkeypatch.setattr(
        "app.auth.security.verify_token", lambda token: {"sub": "user123"}
    )

    mock_db = AsyncMock()
    mock_db.users.find_one.side_effect = Exception("DB failure")
    monkeypatch.setattr(service, "get_db", lambda: mock_db)

    with pytest.raises(HTTPException) as exc_info:
        await service.verify_access_token("token")

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "Internal server error"


@pytest.mark.asyncio
async def test_verify_access_token_user_not_found(monkeypatch):
    service = AuthService()

    monkeypatch.setattr(
        "app.auth.security.verify_token", lambda token: {"sub": "user123"}
    )

    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = None
    monkeypatch.setattr(service, "get_db", lambda: mock_db)

    with pytest.raises(HTTPException) as exc_info:
        await service.verify_access_token("token")

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "User not found"


@pytest.mark.asyncio
async def test_request_password_reset_user_exists(monkeypatch, caplog):
    service = AuthService()
    mock_db = AsyncMock()
    mock_user = {"_id": "mock_user_id", "email": "test@example.com"}

    mock_db.users.find_one.return_value = mock_user
    mock_db.password_resets.insert_one.return_value = None

    monkeypatch.setattr(
        service, "get_db", lambda: mock_db
    )  # temporarily override get_db in function scope

    # Mock the token generator
    with patch("app.auth.service.generate_reset_token", return_value="mocktoken"):
        with caplog.at_level(
            logging.INFO
        ):  # caplog captures the log messages (previously print statements)
            result = await service.request_password_reset("test@example.com")

    # Assert
    assert result is True
    assert "mocktoken" in caplog.text
    assert "Reset link" in caplog.text
    mock_db.users.find_one.assert_awaited_once_with(
        {"email": "test@example.com"})
    mock_db.password_resets.insert_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_request_password_reset_user_does_not_exist(monkeypatch):
    service = AuthService()
    mock_db = AsyncMock()
    mock_db.users.find_one.return_value = None  # No user found

    monkeypatch.setattr(service, "get_db", lambda: mock_db)

    result = await service.request_password_reset("nonexistent@example.com")

    assert result is True
    mock_db.users.find_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_request_password_reset_db_error_on_lookup(monkeypatch):
    service = AuthService()
    mock_db = AsyncMock()
    mock_db.users.find_one.side_effect = PyMongoError("DB failure")

    monkeypatch.setattr(service, "get_db", lambda: mock_db)

    with pytest.raises(HTTPException) as exc_info:
        await service.request_password_reset("test@example.com")

    assert exc_info.value.status_code == 500
    assert "user lookup" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_request_password_reset_db_error_on_insert(monkeypatch):
    service = AuthService()
    mock_db = AsyncMock()
    mock_user = {"_id": "mock_user_id", "email": "test@example.com"}
    mock_db.users.find_one.return_value = mock_user
    mock_db.password_resets.insert_one.side_effect = PyMongoError(
        "Insert failure")

    monkeypatch.setattr(service, "get_db", lambda: mock_db)

    with patch("app.auth.service.generate_reset_token", return_value="mocktoken"):
        with pytest.raises(HTTPException) as exc_info:
            await service.request_password_reset("test@example.com")

    assert exc_info.value.status_code == 500
    assert "token storage" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_confirm_password_reset_success():
    service = AuthService()
    mock_db = MagicMock()
    mock_user_id = ObjectId()

    future_time = datetime.now(timezone.utc) + timedelta(hours=1)

    with patch.object(service, "get_db", return_value=mock_db):
        # Mock reset token lookup
        mock_db.password_resets.find_one = AsyncMock(
            return_value={
                "token": "validtoken",
                "used": False,
                "expires_at": future_time,
                "_id": ObjectId(),
                "user_id": mock_user_id,
            }
        )

        # Mock user update
        mock_db.users.update_one = AsyncMock(
            return_value=MagicMock(modified_count=1))
        mock_db.password_resets.update_one = AsyncMock()
        mock_db.refresh_tokens.update_many = AsyncMock()

        result = await service.confirm_password_reset("validtoken", "newpassword123")
        assert result is True

        mock_db.users.update_one.assert_awaited_once()
        mock_db.refresh_tokens.update_many.assert_awaited_once()


@pytest.mark.asyncio
async def test_confirm_password_reset_invalid_or_expired_token():
    service = AuthService()
    mock_db = MagicMock()

    with patch.object(service, "get_db", return_value=mock_db):
        # Simulate token not found (invalid, used, or expired)
        mock_db.password_resets.find_one = AsyncMock(return_value=None)

        with pytest.raises(HTTPException) as exc_info:
            await service.confirm_password_reset("badtoken", "irrelevantpassword")

        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == "Invalid or expired reset token"

        # No DB updates should have been made
        mock_db.users.update_one.assert_not_called()
        mock_db.password_resets.update_one.assert_not_called()
        mock_db.refresh_tokens.update_many.assert_not_called()


@pytest.mark.asyncio
async def test_create_refresh_token_record_success():
    service = AuthService()
    mock_db = MagicMock()
    mock_token = "mocked_refresh_token"
    mock_user_id = str(ObjectId())

    # Patch get_db and create_refresh_token
    with patch.object(service, "get_db", return_value=mock_db), patch(
        "app.auth.service.create_refresh_token", return_value=mock_token
    ):

        # Mock insert
        mock_db.refresh_tokens.insert_one = AsyncMock()

        result = await service._create_refresh_token_record(mock_user_id)

        assert result == mock_token
        mock_db.refresh_tokens.insert_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_refresh_token_record_db_failure():
    service = AuthService()
    mock_db = MagicMock()
    mock_user_id = str(ObjectId())

    with patch.object(service, "get_db", return_value=mock_db), patch(
        "app.auth.service.create_refresh_token", return_value="badtoken"
    ):

        # DB failure
        mock_db.refresh_tokens.insert_one = AsyncMock(
            side_effect=Exception("DB write error")
        )

        with pytest.raises(HTTPException) as exc_info:
            await service._create_refresh_token_record(mock_user_id)

        assert exc_info.value.status_code == 500
        assert "Failed to create refresh token" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_refresh_token_record_invalid_user_id():
    service = AuthService()
    invalid_user_id = "not-a-valid-objectid"

    with pytest.raises(HTTPException) as exc_info:
        validate_object_id(invalid_user_id, field_name="user ID")

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Invalid user ID"
