"""
Test Utilities for Authentication Tests

This module provides utility functions and fixtures for authentication testing.
"""

import pytest
from typing import Dict, Any
from fastapi.testclient import TestClient
from bson import ObjectId
from datetime import datetime, timedelta

class AuthTestHelper:
    """Helper class for common authentication test operations"""
    
    def __init__(self, client: TestClient, db):
        self.client = client
        self.db = db
    
    async def create_test_user(self, 
                             email: str = "test@example.com",
                             password: str = "password123", 
                             name: str = "Test User") -> Dict[str, Any]:
        """Create a test user and return the signup response"""
        signup_data = {"email": email, "password": password, "name": name}
        response = self.client.post("/auth/signup/email", json=signup_data)
        assert response.status_code == 200
        return response.json()
    
    async def login_test_user(self, email: str, password: str) -> Dict[str, Any]:
        """Login a test user and return the login response"""
        login_data = {"email": email, "password": password}
        response = self.client.post("/auth/login/email", json=login_data)
        assert response.status_code == 200
        return response.json()
    
    async def create_password_reset_token(self, user_id: str, 
                                        expires_hours: int = 1,
                                        used: bool = False) -> str:
        """Create a password reset token in the database"""
        token_value = f"test_reset_token_{user_id}_{datetime.utcnow().timestamp()}"
        await self.db.password_resets.insert_one({
            "user_id": ObjectId(user_id),
            "token": token_value,
            "expires_at": datetime.utcnow() + timedelta(hours=expires_hours),
            "used": used,
            "created_at": datetime.utcnow()
        })
        return token_value
    
    async def create_refresh_token(self, user_id: str, 
                                 revoked: bool = False,
                                 expires_days: int = 30) -> str:
        """Create a refresh token in the database"""
        from app.auth.security import create_refresh_token
        token_value = create_refresh_token()
        await self.db.refresh_tokens.insert_one({
            "user_id": ObjectId(user_id),
            "token": token_value,
            "expires_at": datetime.utcnow() + timedelta(days=expires_days),
            "revoked": revoked,
            "created_at": datetime.utcnow()
        })
        return token_value
    
    def assert_valid_auth_response(self, response_data: Dict[str, Any]):
        """Assert that an auth response has the expected structure"""
        assert "access_token" in response_data
        assert "refresh_token" in response_data
        assert "user" in response_data
        assert "id" in response_data["user"]
        assert "email" in response_data["user"]
        assert "name" in response_data["user"]
    
    def assert_valid_token_response(self, response_data: Dict[str, Any]):
        """Assert that a token response has the expected structure"""
        assert "access_token" in response_data
        assert "refresh_token" in response_data
    
    def assert_valid_user_response(self, response_data: Dict[str, Any]):
        """Assert that a user response has the expected structure"""
        assert "id" in response_data
        assert "email" in response_data
        assert "name" in response_data
    
    async def cleanup_user_data(self, email: str):
        """Clean up all data for a test user"""
        user = await self.db.users.find_one({"email": email})
        if user:
            user_id = user["_id"]
            # Clean up refresh tokens
            await self.db.refresh_tokens.delete_many({"user_id": user_id})
            # Clean up password reset tokens
            await self.db.password_resets.delete_many({"user_id": user_id})
            # Clean up user
            await self.db.users.delete_one({"_id": user_id})


@pytest.fixture
def auth_helper(client: TestClient, db):
    """Fixture that provides an AuthTestHelper instance"""
    return AuthTestHelper(client, db)


# Common test data
TEST_USERS = [
    {
        "email": "user1@example.com",
        "password": "password123",
        "name": "Test User One"
    },
    {
        "email": "user2@example.com", 
        "password": "differentpass456",
        "name": "Test User Two"
    },
    {
        "email": "admin@example.com",
        "password": "adminpass789",
        "name": "Admin User"
    }
]

INVALID_EMAILS = [
    "",
    "not-an-email",
    "@example.com",
    "user@",
    "user..name@example.com",
    "user name@example.com"
]

INVALID_PASSWORDS = [
    "",
    "123",
    "short",
    "12345"  # Less than 6 characters
]

INVALID_TOKENS = [
    "",
    "invalid",
    "not.a.jwt",
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid",
    "Bearer invalid_token"
]


def get_mock_google_user_data(email: str = "google@example.com", 
                            name: str = "Google User",
                            firebase_uid: str = "google_firebase_123"):
    """Get mock Google user data for testing"""
    return {
        "email": email,
        "name": name,
        "firebase_uid": firebase_uid,
        "avatar": f"https://example.com/avatar/{firebase_uid}.jpg"
    }


def get_expired_jwt_token(user_id: str) -> str:
    """Generate an expired JWT token for testing"""
    from app.auth.security import create_access_token
    from datetime import timedelta
    
    return create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(seconds=-60)  # Expired 1 minute ago
    )


def get_invalid_signature_token(user_id: str) -> str:
    """Generate a JWT token with invalid signature for testing"""
    from jose import jwt
    from app.config import settings
    from datetime import datetime, timedelta
    
    # Create token with wrong secret
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=15)
    }
    return jwt.encode(payload, "wrong_secret", algorithm="HS256")
