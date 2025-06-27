from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Request Models
class EmailSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    id_token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=6)

class TokenVerifyRequest(BaseModel):
    access_token: str

# Response Models
class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    avatar: Optional[str] = None
    currency: str = "USD"
    created_at: datetime

    class Config:
        populate_by_name = True

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None

class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
