from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.config import settings
import secrets

# Password hashing with better bcrypt configuration
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    # Fallback for bcrypt version compatibility issues
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies whether a plaintext password matches a given hashed password.
    
    Args:
        plain_password: The plaintext password to verify.
        hashed_password: The hashed password to compare against.
    
    Returns:
        True if the plaintext password matches the hash, otherwise False.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hashes a plaintext password using bcrypt.
    
    Args:
        password: The plaintext password to hash.
    
    Returns:
        The bcrypt-hashed password as a string.
    """
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT access token embedding the provided data and an expiration time.
    
    If `expires_delta` is not specified, the token expires after the default duration from settings. The payload includes an expiration timestamp and a type field set to "access". The token is signed using the configured secret key and algorithm.
    
    Args:
        data: The payload to include in the token.
        expires_delta: Optional timedelta specifying how long the token is valid.
    
    Returns:
        A signed JWT access token as a string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def create_refresh_token() -> str:
    """
    Generates a secure random refresh token as a URL-safe string.
    
    Returns:
        A cryptographically secure, URL-safe refresh token string.
    """
    return secrets.token_urlsafe(32)

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verifies and decodes a JWT token.
    
    If the token is invalid or cannot be verified, raises an HTTP 401 Unauthorized exception.
    Returns the decoded token payload as a dictionary.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def generate_reset_token() -> str:
    """
    Generates a secure, URL-safe token for password reset operations.
    
    Returns:
        A random 32-byte URL-safe string suitable for use as a password reset token.
    """
    return secrets.token_urlsafe(32)
