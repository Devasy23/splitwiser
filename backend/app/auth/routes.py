from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.schemas import (
    EmailSignupRequest, EmailLoginRequest, GoogleLoginRequest,
    RefreshTokenRequest, PasswordResetRequest, PasswordResetConfirm,
    TokenVerifyRequest, AuthResponse, TokenResponse, SuccessResponse,
    UserResponse, ErrorResponse
)
from app.auth.service import auth_service
from app.auth.security import create_access_token
from datetime import timedelta
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup/email", response_model=AuthResponse)
async def signup_with_email(request: EmailSignupRequest):
    """
    Register a new user with email, password, and name, returning authentication tokens and user information.
    
    Parameters:
        request (EmailSignupRequest): Registration details including email, password, and name.
    
    Returns:
        AuthResponse: Contains access token, refresh token, and user details.
    """
    try:
        result = await auth_service.create_user_with_email(
            email=request.email,
            password=request.password,
            name=request.name
        )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(result["user"]["_id"])},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        # Convert ObjectId to string for response
        result["user"]["_id"] = str(result["user"]["_id"])
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=result["refresh_token"],
            user=UserResponse(**result["user"])
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login/email", response_model=AuthResponse)
async def login_with_email(request: EmailLoginRequest):
    """
    Authenticate a user with email and password, returning access and refresh tokens along with user details.
    
    Returns:
        AuthResponse: Contains the JWT access token, refresh token, and authenticated user information.
    """
    try:
        result = await auth_service.authenticate_user_with_email(
            email=request.email,
            password=request.password
        )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(result["user"]["_id"])},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        # Convert ObjectId to string for response
        result["user"]["_id"] = str(result["user"]["_id"])
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=result["refresh_token"],
            user=UserResponse(**result["user"])
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/login/google", response_model=AuthResponse)
async def login_with_google(request: GoogleLoginRequest):
    """
    Authenticate or register a user using a Google OAuth ID token.
    
    Returns:
        AuthResponse: Contains a JWT access token, refresh token, and user information upon successful authentication or registration.
    """
    try:
        result = await auth_service.authenticate_with_google(request.id_token)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(result["user"]["_id"])},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        # Convert ObjectId to string for response
        result["user"]["_id"] = str(result["user"]["_id"])
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=result["refresh_token"],
            user=UserResponse(**result["user"])
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed: {str(e)}"
        )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refreshes JWT access and refresh tokens using a valid refresh token.
    
    Validates the provided refresh token, issues new tokens if valid, and returns them. Raises a 401 error if the refresh token is invalid or revoked.
    
    Returns:
        TokenResponse: Contains the new access and refresh tokens.
    """
    try:
        new_refresh_token = await auth_service.refresh_access_token(request.refresh_token)
        
        # Get user from the new refresh token to create access token
        from app.database import get_database
        db = get_database()
        token_record = await db.refresh_tokens.find_one({
            "token": new_refresh_token,
            "revoked": False
        })
        
        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to create new tokens"
            )
          # Create new access token
        access_token = create_access_token(
            data={"sub": str(token_record["user_id"])},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

@router.post("/token/verify", response_model=UserResponse)
async def verify_token(request: TokenVerifyRequest):
    """
    Verify an access token and return the corresponding user information.
    
    Returns:
        UserResponse: User data associated with the valid access token.
    
    Raises:
        HTTPException: Returns 401 Unauthorized if the token is invalid or expired.
    """
    try:
        user = await auth_service.verify_access_token(request.access_token)
        
        # Convert ObjectId to string for response
        user["_id"] = str(user["_id"])
        
        return UserResponse(**user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

@router.post("/password/reset/request", response_model=SuccessResponse)
async def request_password_reset(request: PasswordResetRequest):
    """
    Initiate a password reset by sending a reset link to the specified email address.
    
    Returns:
        SuccessResponse: Indicates that a reset link has been sent if the email exists in the system.
    """
    try:
        await auth_service.request_password_reset(request.email)
        return SuccessResponse(
            success=True,
            message="If the email exists, a reset link has been sent"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset request failed: {str(e)}"
        )

@router.post("/password/reset/confirm", response_model=SuccessResponse)
async def confirm_password_reset(request: PasswordResetConfirm):
    """
    Reset a user's password using a valid reset token and new password.
    
    Returns:
        SuccessResponse: Indicates the password has been reset successfully.
    """
    try:
        await auth_service.confirm_password_reset(
            reset_token=request.reset_token,
            new_password=request.new_password
        )
        return SuccessResponse(
            success=True,
            message="Password has been reset successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}"
        )
