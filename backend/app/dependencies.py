from typing import Any, Dict

from app.auth.security import verify_token
from app.database import get_database
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    """
    Retrieves the currently authenticated user based on a JWT token from the HTTP Authorization header.

    Verifies the provided JWT token, extracts the user ID, and fetches the corresponding user document from the database. Raises an HTTP 401 Unauthorized error if the token is invalid, the user ID is missing, or the user does not exist.

    Returns:
        A dictionary representing the authenticated user, with the `_id` field as a string.
    """
    try:
        # Verify token
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get user from database
        db = get_database()
        user = await db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create a copy of the user document to avoid mutating the original
        user_copy = dict(user)
        # Convert ObjectId to string
        user_copy["_id"] = str(user_copy["_id"])
        return user_copy

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
