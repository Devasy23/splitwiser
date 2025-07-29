from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field
from pydantic.config import ConfigDict


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    image_url: Optional[str] = Field(default=None, alias="imageUrl")
    currency: str = "USD"
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = Field(default=None, alias="imageUrl")
    currency: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class DeleteUserResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
