from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.schemas import (
    EmailSignupRequest, EmailLoginRequest, GoogleLoginRequest,
    RefreshTokenRequest, PasswordResetRequest, PasswordResetConfirm,
    TokenVerifyRequest, AuthResponse, TokenResponse, SuccessResponse,
    UserResponse, ErrorResponse
)
from app.auth.service import auth_service
from app.auth.security import create_access_token, oauth2_scheme # Import oauth2_scheme
from fastapi.security import OAuth2PasswordRequestForm # Import OAuth2PasswordRequestForm
from datetime import timedelta
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/token", response_model=TokenResponse, include_in_schema=False) # include_in_schema=False to hide from docs if desired, or True to show
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests.
    This endpoint is used by Swagger UI for authorization.
    It expects username (email) and password in form-data.
    """
    try:
        # Note: OAuth2PasswordRequestForm uses 'username' field for the user identifier.
        # We'll treat it as email here.
        result = await auth_service.authenticate_user_with_email(
            email=form_data.username, # form_data.username is the email
            password=form_data.password
        )

        access_token = create_access_token(
            data={"sub": str(result["user"]["_id"])},
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )

        return TokenResponse(access_token=access_token, token_type="bearer")
    except HTTPException:
        raise
    except Exception as e:
        # It's good practice to log the exception here
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("/signup/email", response_model=AuthResponse)
async def signup_with_email(request: EmailSignupRequest):
    """
    Registers a new user using email, password, and name, and returns authentication tokens and user information.
    
    Args:
        request: Contains the user's email, password, and name for registration.
    
    Returns:
        An AuthResponse with access token, refresh token, and user details.
    
    Raises:
        HTTPException: If registration fails or an unexpected error occurs.
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
    Authenticates a user using email and password credentials.
    
    On successful authentication, returns an access token, refresh token, and user information. Raises an HTTP 500 error if authentication fails due to an unexpected error.
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
    Authenticates or registers a user using a Google OAuth ID token.
    
    On success, returns an access token, refresh token, and user information. Raises an HTTP 500 error if Google authentication fails.
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
    Refreshes JWT tokens using a valid refresh token.
    
    Validates the provided refresh token, issues a new access token and refresh token if valid, and returns them. Raises a 401 error if the refresh token is invalid or revoked.
    	
    Returns:
    	A TokenResponse containing the new access and refresh tokens.
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
    Verifies an access token and returns the associated user information.
    
    Raises:
        HTTPException: If the token is invalid or expired, returns a 401 Unauthorized error.
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
    Initiates a password reset process by sending a reset link to the provided email address.
    
    Returns:
        SuccessResponse: Indicates whether the password reset email was sent if the email exists.
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
    Resets a user's password using a valid password reset token.
    
    Args:
        request: Contains the password reset token and the new password.
    
    Returns:
        SuccessResponse indicating the password has been reset successfully.
    
    Raises:
        HTTPException: If the reset token is invalid or an error occurs during the reset process.
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
