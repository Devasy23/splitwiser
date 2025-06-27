from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserProfileResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    imageUrl: Optional[str] = Field(default=None, alias="avatar")
    currency: str = "USD"
    createdAt: datetime
    updatedAt: datetime

    model_config = {"populate_by_name": True}

class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    imageUrl: Optional[str] = None
    currency: Optional[str] = None

    model_config = {"populate_by_name": True}

class DeleteUserResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None

    model_config = {"populate_by_name": True}
