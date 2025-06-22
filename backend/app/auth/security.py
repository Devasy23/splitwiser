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
    Check if a plaintext password matches a given bcrypt hashed password.
    
    Parameters:
    	plain_password (str): The plaintext password to verify.
    	hashed_password (str): The bcrypt hashed password to compare against.
    
    Returns:
    	bool: True if the plaintext password matches the hashed password, otherwise False.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a plaintext password using bcrypt and return the hashed string.
    
    Parameters:
        password (str): The plaintext password to be hashed.
    
    Returns:
        str: The bcrypt hash of the provided password.
    """
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a signed JWT access token containing the provided payload and an expiration time.
    
    Parameters:
        data (Dict[str, Any]): The payload to embed in the token.
        expires_delta (Optional[timedelta]): Optional duration for which the token remains valid. If not provided, a default expiration from settings is used.
    
    Returns:
        str: The encoded JWT access token as a string.
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
    Generate a cryptographically secure, URL-safe random string for use as a refresh token.
    
    Returns:
        str: A secure, URL-safe refresh token string.
    """
    return secrets.token_urlsafe(32)

def verify_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token, returning its payload as a dictionary.
    
    Raises an HTTP 401 Unauthorized exception if the token is invalid or verification fails.
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
    Generate a cryptographically secure, URL-safe random string for use as a password reset token.
    
    Returns:
        str: A random 32-byte URL-safe string suitable for password reset operations.
    """
    return secrets.token_urlsafe(32)
