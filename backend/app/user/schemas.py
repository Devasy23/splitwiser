from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    imageUrl: Optional[str] = None
    currency: str = "USD"
    createdAt: datetime
    updatedAt: datetime


class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    imageUrl: Optional[str] = None
    currency: Optional[str] = None


class DeleteUserResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
