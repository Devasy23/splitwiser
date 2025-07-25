import pytest
from pydantic import ValidationError
from datetime import datetime
from backend.auth.schemas import (
    EmailSignupRequest,
    EmailLoginRequest,
    GoogleLoginRequest,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    TokenVerifyRequest,
    UserResponse,
    AuthResponse,
    TokenResponse,
    SuccessResponse,
    ErrorResponse
)


class TestEmailSignupRequest:
    """Test cases for EmailSignupRequest schema"""

    def test_valid_email_signup_request(self):
        """Test valid email signup request"""
        data = {
            "email": "test@example.com",
            "password": "password123",
            "name": "John Doe"
        }
        request = EmailSignupRequest(**data)
        assert request.email == "test@example.com"
        assert request.password == "password123"
        assert request.name == "John Doe"

    def test_email_signup_request_invalid_email(self):
        """Test email signup request with invalid email"""
        data = {
            "email": "invalid-email",
            "password": "password123",
            "name": "John Doe"
        }
        with pytest.raises(ValidationError) as exc_info:
            EmailSignupRequest(**data)
        assert "value is not a valid email address" in str(exc_info.value)

    def test_email_signup_request_short_password(self):
        """Test email signup request with password too short"""
        data = {
            "email": "test@example.com",
            "password": "123",
            "name": "John Doe"
        }
        with pytest.raises(ValidationError) as exc_info:
            EmailSignupRequest(**data)
        assert "at least 6 characters" in str(exc_info.value)

    def test_email_signup_request_empty_name(self):
        """Test email signup request with empty name"""
        data = {
            "email": "test@example.com",
            "password": "password123",
            "name": ""
        }
        with pytest.raises(ValidationError) as exc_info:
            EmailSignupRequest(**data)
        assert "at least 1 character" in str(exc_info.value)

    def test_email_signup_request_missing_fields(self):
        """Test email signup request with missing required fields"""
        # Missing email
        data = {"password": "password123", "name": "John Doe"}
        with pytest.raises(ValidationError):
            EmailSignupRequest(**data)

        # Missing password
        data = {"email": "test@example.com", "name": "John Doe"}
        with pytest.raises(ValidationError):
            EmailSignupRequest(**data)

        # Missing name
        data = {"email": "test@example.com", "password": "password123"}
        with pytest.raises(ValidationError):
            EmailSignupRequest(**data)

    def test_email_signup_request_whitespace_name(self):
        """Test email signup request with only whitespace name"""
        data = {
            "email": "test@example.com",
            "password": "password123",
            "name": "   "
        }
        # Should be valid as whitespace counts as characters for min_length
        request = EmailSignupRequest(**data)
        assert request.name == "   "

    def test_email_signup_request_unicode_characters(self):
        """Test email signup request with unicode characters in name"""
        data = {
            "email": "test@example.com",
            "password": "password123",
            "name": "José María"
        }
        request = EmailSignupRequest(**data)
        assert request.name == "José María"

    def test_email_signup_request_long_password(self):
        """Test email signup request with very long password"""
        long_password = "a" * 1000
        data = {
            "email": "test@example.com",
            "password": long_password,
            "name": "John Doe"
        }
        request = EmailSignupRequest(**data)
        assert request.password == long_password


class TestEmailLoginRequest:
    """Test cases for EmailLoginRequest schema"""

    def test_valid_email_login_request(self):
        """Test valid email login request"""
        data = {
            "email": "test@example.com",
            "password": "password123"
        }
        request = EmailLoginRequest(**data)
        assert request.email == "test@example.com"
        assert request.password == "password123"

    def test_email_login_request_invalid_email(self):
        """Test email login request with invalid email"""
        data = {
            "email": "not-an-email",
            "password": "password123"
        }
        with pytest.raises(ValidationError) as exc_info:
            EmailLoginRequest(**data)
        assert "value is not a valid email address" in str(exc_info.value)

    def test_email_login_request_empty_password(self):
        """Test email login request with empty password"""
        data = {
            "email": "test@example.com",
            "password": ""
        }
        # Should be valid as no min_length constraint on login password
        request = EmailLoginRequest(**data)
        assert request.password == ""

    def test_email_login_request_missing_fields(self):
        """Test email login request with missing required fields"""
        # Missing email
        with pytest.raises(ValidationError):
            EmailLoginRequest(password="password123")

        # Missing password
        with pytest.raises(ValidationError):
            EmailLoginRequest(email="test@example.com")

    def test_email_login_request_various_email_formats(self):
        """Test email login request with various valid email formats"""
        valid_emails = [
            "user@domain.com",
            "user.name@domain.com",
            "user+tag@domain.com",
            "user123@sub.domain.com",
            "a@b.co"
        ]

        for email in valid_emails:
            data = {"email": email, "password": "password"}
            request = EmailLoginRequest(**data)
            assert request.email == email


class TestGoogleLoginRequest:
    """Test cases for GoogleLoginRequest schema"""

    def test_valid_google_login_request(self):
        """Test valid Google login request"""
        data = {"id_token": "valid.jwt.token"}
        request = GoogleLoginRequest(**data)
        assert request.id_token == "valid.jwt.token"

    def test_google_login_request_empty_token(self):
        """Test Google login request with empty token"""
        data = {"id_token": ""}
        request = GoogleLoginRequest(**data)
        assert request.id_token == ""

    def test_google_login_request_missing_token(self):
        """Test Google login request with missing token"""
        with pytest.raises(ValidationError):
            GoogleLoginRequest()

    def test_google_login_request_jwt_like_token(self):
        """Test Google login request with JWT-like token"""
        jwt_token = "header.payload.signature"
        data = {"id_token": jwt_token}
        request = GoogleLoginRequest(**data)
        assert request.id_token == jwt_token


class TestRefreshTokenRequest:
    """Test cases for RefreshTokenRequest schema"""

    def test_valid_refresh_token_request(self):
        """Test valid refresh token request"""
        data = {"refresh_token": "valid-refresh-token"}
        request = RefreshTokenRequest(**data)
        assert request.refresh_token == "valid-refresh-token"

    def test_refresh_token_request_empty_token(self):
        """Test refresh token request with empty token"""
        data = {"refresh_token": ""}
        request = RefreshTokenRequest(**data)
        assert request.refresh_token == ""

    def test_refresh_token_request_missing_token(self):
        """Test refresh token request with missing token"""
        with pytest.raises(ValidationError):
            RefreshTokenRequest()

    def test_refresh_token_request_long_token(self):
        """Test refresh token request with very long token"""
        long_token = "x" * 10000
        data = {"refresh_token": long_token}
        request = RefreshTokenRequest(**data)
        assert request.refresh_token == long_token


class TestPasswordResetRequest:
    """Test cases for PasswordResetRequest schema"""

    def test_valid_password_reset_request(self):
        """Test valid password reset request"""
        data = {"email": "test@example.com"}
        request = PasswordResetRequest(**data)
        assert request.email == "test@example.com"

    def test_password_reset_request_invalid_email(self):
        """Test password reset request with invalid email"""
        data = {"email": "invalid-email"}
        with pytest.raises(ValidationError) as exc_info:
            PasswordResetRequest(**data)
        assert "value is not a valid email address" in str(exc_info.value)

    def test_password_reset_request_missing_email(self):
        """Test password reset request with missing email"""
        with pytest.raises(ValidationError):
            PasswordResetRequest()

    def test_password_reset_request_international_domain(self):
        """Test password reset request with international domain"""
        data = {"email": "user@münchen.de"}
        request = PasswordResetRequest(**data)
        assert request.email == "user@münchen.de"


class TestPasswordResetConfirm:
    """Test cases for PasswordResetConfirm schema"""

    def test_valid_password_reset_confirm(self):
        """Test valid password reset confirm"""
        data = {
            "reset_token": "valid-reset-token",
            "new_password": "newpassword123"
        }
        request = PasswordResetConfirm(**data)
        assert request.reset_token == "valid-reset-token"
        assert request.new_password == "newpassword123"

    def test_password_reset_confirm_short_password(self):
        """Test password reset confirm with short password"""
        data = {
            "reset_token": "valid-reset-token",
            "new_password": "123"
        }
        with pytest.raises(ValidationError) as exc_info:
            PasswordResetConfirm(**data)
        assert "at least 6 characters" in str(exc_info.value)

    def test_password_reset_confirm_missing_fields(self):
        """Test password reset confirm with missing fields"""
        # Missing reset_token
        with pytest.raises(ValidationError):
            PasswordResetConfirm(new_password="newpassword123")

        # Missing new_password
        with pytest.raises(ValidationError):
            PasswordResetConfirm(reset_token="valid-reset-token")

    def test_password_reset_confirm_empty_token(self):
        """Test password reset confirm with empty token"""
        data = {
            "reset_token": "",
            "new_password": "newpassword123"
        }
        request = PasswordResetConfirm(**data)
        assert request.reset_token == ""

    def test_password_reset_confirm_special_characters_password(self):
        """Test password reset confirm with special characters in password"""
        data = {
            "reset_token": "token123",
            "new_password": "P@ssw0rd!#$"
        }
        request = PasswordResetConfirm(**data)
        assert request.new_password == "P@ssw0rd!#$"


class TestTokenVerifyRequest:
    """Test cases for TokenVerifyRequest schema"""

    def test_valid_token_verify_request(self):
        """Test valid token verify request"""
        data = {"access_token": "valid-access-token"}
        request = TokenVerifyRequest(**data)
        assert request.access_token == "valid-access-token"

    def test_token_verify_request_empty_token(self):
        """Test token verify request with empty token"""
        data = {"access_token": ""}
        request = TokenVerifyRequest(**data)
        assert request.access_token == ""

    def test_token_verify_request_missing_token(self):
        """Test token verify request with missing token"""
        with pytest.raises(ValidationError):
            TokenVerifyRequest()

    def test_token_verify_request_bearer_token_format(self):
        """Test token verify request with Bearer token format"""
        data = {"access_token": "Bearer jwt.token.here"}
        request = TokenVerifyRequest(**data)
        assert request.access_token == "Bearer jwt.token.here"


class TestUserResponse:
    """Test cases for UserResponse schema"""

    def test_valid_user_response(self):
        """Test valid user response"""
        data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "created_at": datetime.now()
        }
        response = UserResponse(**data)
        assert response.id == "user123"
        assert response.email == "test@example.com"
        assert response.name == "John Doe"
        assert response.avatar is None
        assert response.currency == "USD"
        assert isinstance(response.created_at, datetime)

    def test_user_response_with_optional_fields(self):
        """Test user response with optional fields"""
        data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "avatar": "https://example.com/avatar.jpg",
            "currency": "EUR",
            "created_at": datetime.now()
        }
        response = UserResponse(**data)
        assert response.avatar == "https://example.com/avatar.jpg"
        assert response.currency == "EUR"

    def test_user_response_id_alias(self):
        """Test user response ID field alias"""
        data = {
            "id": "user123",  # Using alias instead of _id
            "email": "test@example.com",
            "name": "John Doe",
            "created_at": datetime.now()
        }
        response = UserResponse(**data)
        assert response.id == "user123"

    def test_user_response_missing_required_fields(self):
        """Test user response with missing required fields"""
        # Missing _id/id
        data = {
            "email": "test@example.com",
            "name": "John Doe",
            "created_at": datetime.now()
        }
        with pytest.raises(ValidationError):
            UserResponse(**data)

        # Missing email
        data = {
            "_id": "user123",
            "name": "John Doe",
            "created_at": datetime.now()
        }
        with pytest.raises(ValidationError):
            UserResponse(**data)

    def test_user_response_invalid_datetime(self):
        """Test user response with invalid datetime"""
        data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "created_at": "not-a-datetime"
        }
        with pytest.raises(ValidationError):
            UserResponse(**data)

    def test_user_response_various_currencies(self):
        """Test user response with various currency codes"""
        currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]

        for currency in currencies:
            data = {
                "_id": "user123",
                "email": "test@example.com",
                "name": "John Doe",
                "currency": currency,
                "created_at": datetime.now()
            }
            response = UserResponse(**data)
            assert response.currency == currency

    def test_user_response_datetime_formats(self):
        """Test user response with different datetime objects"""
        test_datetime = datetime(2023, 1, 15, 10, 30, 45)
        data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "created_at": test_datetime
        }
        response = UserResponse(**data)
        assert response.created_at == test_datetime


class TestAuthResponse:
    """Test cases for AuthResponse schema"""

    def test_valid_auth_response(self):
        """Test valid auth response"""
        user_data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "created_at": datetime.now()
        }
        data = {
            "access_token": "access-token-123",
            "refresh_token": "refresh-token-123",
            "user": user_data
        }
        response = AuthResponse(**data)
        assert response.access_token == "access-token-123"
        assert response.refresh_token == "refresh-token-123"
        assert isinstance(response.user, UserResponse)
        assert response.user.id == "user123"

    def test_auth_response_missing_fields(self):
        """Test auth response with missing required fields"""
        user_data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "created_at": datetime.now()
        }

        # Missing access_token
        with pytest.raises(ValidationError):
            AuthResponse(refresh_token="refresh-token-123", user=user_data)

        # Missing refresh_token
        with pytest.raises(ValidationError):
            AuthResponse(access_token="access-token-123", user=user_data)

        # Missing user
        with pytest.raises(ValidationError):
            AuthResponse(access_token="access-token-123", refresh_token="refresh-token-123")

    def test_auth_response_with_complete_user(self):
        """Test auth response with complete user data"""
        user_data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "avatar": "https://example.com/avatar.jpg",
            "currency": "GBP",
            "created_at": datetime.now()
        }
        data = {
            "access-token": "access-token-123",
            "refresh-token": "refresh-token-123",
            "user": user_data
        }
        response = AuthResponse(**data)
        assert response.user.avatar == "https://example.com/avatar.jpg"
        assert response.user.currency == "GBP"


class TestTokenResponse:
    """Test cases for TokenResponse schema"""

    def test_valid_token_response(self):
        """Test valid token response"""
        data = {"access_token": "access-token-123"}
        response = TokenResponse(**data)
        assert response.access_token == "access-token-123"
        assert response.refresh_token is None

    def test_token_response_with_refresh_token(self):
        """Test token response with refresh token"""
        data = {
            "access_token": "access-token-123",
            "refresh_token": "refresh-token-123"
        }
        response = TokenResponse(**data)
        assert response.access_token == "access-token-123"
        assert response.refresh_token == "refresh-token-123"

    def test_token_response_missing_access_token(self):
        """Test token response with missing access token"""
        with pytest.raises(ValidationError):
            TokenResponse(refresh_token="refresh-token-123")

    def test_token_response_empty_tokens(self):
        """Test token response with empty tokens"""
        data = {
            "access_token": "",
            "refresh_token": ""
        }
        response = TokenResponse(**data)
        assert response.access_token == ""
        assert response.refresh_token == ""


class TestSuccessResponse:
    """Test cases for SuccessResponse schema"""

    def test_valid_success_response_defaults(self):
        """Test valid success response with defaults"""
        response = SuccessResponse()
        assert response.success is True
        assert response.message is None

    def test_success_response_with_message(self):
        """Test success response with custom message"""
        data = {"message": "Operation completed successfully"}
        response = SuccessResponse(**data)
        assert response.success is True
        assert response.message == "Operation completed successfully"

    def test_success_response_with_custom_success(self):
        """Test success response with custom success value"""
        data = {"success": False, "message": "Operation failed"}
        response = SuccessResponse(**data)
        assert response.success is False
        assert response.message == "Operation failed"

    def test_success_response_empty_message(self):
        """Test success response with empty message"""
        data = {"message": ""}
        response = SuccessResponse(**data)
        assert response.success is True
        assert response.message == ""

    def test_success_response_long_message(self):
        """Test success response with very long message"""
        long_message = "x" * 10000
        data = {"message": long_message}
        response = SuccessResponse(**data)
        assert response.message == long_message


class TestErrorResponse:
    """Test cases for ErrorResponse schema"""

    def test_valid_error_response(self):
        """Test valid error response"""
        data = {"error": "Something went wrong"}
        response = ErrorResponse(**data)
        assert response.error == "Something went wrong"

    def test_error_response_empty_error(self):
        """Test error response with empty error message"""
        data = {"error": ""}
        response = ErrorResponse(**data)
        assert response.error == ""

    def test_error_response_missing_error(self):
        """Test error response with missing error field"""
        with pytest.raises(ValidationError):
            ErrorResponse()

    def test_error_response_detailed_error(self):
        """Test error response with detailed error message"""
        detailed_error = "Validation failed: Email is required, Password must be at least 6 characters"
        data = {"error": detailed_error}
        response = ErrorResponse(**data)
        assert response.error == detailed_error


class TestSchemaIntegration:
    """Integration tests for schema interactions"""

    def test_user_response_in_auth_response(self):
        """Test that UserResponse integrates properly with AuthResponse"""
        user_data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "avatar": "https://example.com/avatar.jpg",
            "currency": "GBP",
            "created_at": datetime(2024, 1, 1, 12, 0, 0)
        }
        auth_data = {
            "access_token": "access-token-123",
            "refresh_token": "refresh-token-123",
            "user": user_data
        }

        auth_response = AuthResponse(**auth_data)
        assert isinstance(auth_response.user, UserResponse)
        assert auth_response.user.id == "user123"
        assert auth_response.user.currency == "GBP"
        assert auth_response.user.avatar == "https://example.com/avatar.jpg"

    def test_password_validation_consistency(self):
        """Test that password validation is consistent across schemas"""
        short_password = "123"

        # EmailSignupRequest should reject short password
        with pytest.raises(ValidationError):
            EmailSignupRequest(
                email="test@example.com",
                password=short_password,
                name="John Doe"
            )

        # PasswordResetConfirm should reject short password
        with pytest.raises(ValidationError):
            PasswordResetConfirm(
                reset_token="token",
                new_password=short_password
            )

        # EmailLoginRequest should accept short password (no validation)
        login_request = EmailLoginRequest(
            email="test@example.com",
            password=short_password
        )
        assert login_request.password == short_password

    def test_email_validation_consistency(self):
        """Test that email validation is consistent across schemas"""
        invalid_email = "not-an-email"

        # EmailSignupRequest should reject invalid email
        with pytest.raises(ValidationError):
            EmailSignupRequest(
                email=invalid_email,
                password="password123",
                name="John Doe"
            )

        # EmailLoginRequest should reject invalid email
        with pytest.raises(ValidationError):
            EmailLoginRequest(
                email=invalid_email,
                password="password123"
            )

        # PasswordResetRequest should reject invalid email
        with pytest.raises(ValidationError):
            PasswordResetRequest(email=invalid_email)

    def test_token_response_vs_auth_response_tokens(self):
        """Test token handling consistency between TokenResponse and AuthResponse"""
        access_token = "test-access-token"
        refresh_token = "test-refresh-token"

        # TokenResponse with both tokens
        token_resp = TokenResponse(access_token=access_token, refresh_token=refresh_token)
        assert token_resp.access_token == access_token
        assert token_resp.refresh_token == refresh_token

        # AuthResponse with same tokens
        user_data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "created_at": datetime.now()
        }
        auth_resp = AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_data
        )
        assert auth_resp.access_token == access_token
        assert auth_resp.refresh_token == refresh_token


class TestSchemaValidationEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_extremely_long_strings(self):
        """Test schemas with extremely long string values"""
        very_long_string = "x" * 100000

        # Test with EmailSignupRequest name
        data = {
            "email": "test@example.com",
            "password": "password123",
            "name": very_long_string
        }
        request = EmailSignupRequest(**data)
        assert len(request.name) == 100000

    def test_unicode_edge_cases(self):
        """Test schemas with various unicode characters"""
        unicode_cases = [
            "测试用户",  # Chinese
            "пользователь",  # Russian
            "🚀🎉👋",  # Emojis
            "café",  # Accented characters
            "नमस्ते"  # Hindi
        ]

        for unicode_name in unicode_cases:
            data = {
                "email": "test@example.com",
                "password": "password123",
                "name": unicode_name
            }
            request = EmailSignupRequest(**data)
            assert request.name == unicode_name

    def test_boundary_password_lengths(self):
        """Test password validation at boundary conditions"""
        # Exactly 6 characters (minimum)
        data = {
            "email": "test@example.com",
            "password": "123456",
            "name": "Test User"
        }
        request = EmailSignupRequest(**data)
        assert len(request.password) == 6

        # 5 characters (should fail)
        data["password"] = "12345"
        with pytest.raises(ValidationError):
            EmailSignupRequest(**data)

    def test_response_model_serialization(self):
        """Test that response models can be properly serialized"""
        user_data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "John Doe",
            "created_at": datetime.now()
        }

        user_response = UserResponse(**user_data)

        # Test that the model can be converted to dict
        user_dict = user_response.model_dump()
        assert "id" in user_dict
        assert user_dict["email"] == "test@example.com"

        # Test with alias
        user_dict_by_alias = user_response.model_dump(by_alias=True)
        assert "_id" in user_dict_by_alias or "id" in user_dict_by_alias


class TestSchemaFieldValidations:
    """Test specific field validations and constraints"""

    def test_email_field_normalization(self):
        """Test email field handles case sensitivity properly"""
        data = {
            "email": "Test.User@EXAMPLE.COM",
            "password": "password123"
        }
        request = EmailLoginRequest(**data)
        # Pydantic EmailStr should normalize the email
        assert "@" in request.email
        assert "example.com" in request.email.lower()

    def test_password_field_types(self):
        """Test password field accepts various string types"""
        passwords = ["simple", "complex123!@#", "unicode测试", "spaces here"]

        for password in passwords:
            if len(password) >= 6:  # Only test valid lengths for signup
                data = {
                    "email": "test@example.com",
                    "password": password,
                    "name": "Test User"
                }
                request = EmailSignupRequest(**data)
                assert request.password == password

    def test_name_field_edge_cases(self):
        """Test name field with various edge cases"""
        edge_cases = [
            "A",  # Single character (minimum)
            "Very Long Name That Contains Many Characters",
            "Name-With-Hyphens",
            "Name With Numbers 123",
            "Name.With.Dots",
            "Name's with apostrophes"
        ]

        for name in edge_cases:
            data = {
                "email": "test@example.com",
                "password": "password123",
                "name": name
            }
            request = EmailSignupRequest(**data)
            assert request.name == name

    def test_user_response_field_defaults(self):
        """Test UserResponse field defaults work correctly"""
        data = {
            "_id": "user123",
            "email": "test@example.com",
            "name": "Test User",
            "created_at": datetime.now()
        }
        response = UserResponse(**data)

        # Test defaults
        assert response.avatar is None
        assert response.currency == "USD"

    def test_success_response_boolean_handling(self):
        """Test SuccessResponse boolean field handling"""
        # Test with explicit True
        response1 = SuccessResponse(success=True)
        assert response1.success is True

        # Test with explicit False
        response2 = SuccessResponse(success=False)
        assert response2.success is False

        # Test default value
        response3 = SuccessResponse()
        assert response3.success is True