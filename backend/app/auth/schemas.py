from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Request Models
class EmailSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)

    model_config = {"populate_by_name": True}

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str

    model_config = {"populate_by_name": True}

class GoogleLoginRequest(BaseModel):
    id_token: str

    model_config = {"populate_by_name": True}

class RefreshTokenRequest(BaseModel):
    refresh_token: str

    model_config = {"populate_by_name": True}

class PasswordResetRequest(BaseModel):
    email: EmailStr

    model_config = {"populate_by_name": True}

class PasswordResetConfirm(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=6)

    model_config = {"populate_by_name": True}

class TokenVerifyRequest(BaseModel):
    access_token: str

    model_config = {"populate_by_name": True}

# Response Models
class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    avatar: Optional[str] = None
    currency: str = "USD"
    created_at: datetime

    model_config = {"populate_by_name": True}

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse

    model_config = {"populate_by_name": True}

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None

    model_config = {"populate_by_name": True}

class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
