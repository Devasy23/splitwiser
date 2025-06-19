# GitHub Actions Setup Guide for Splitwiser Backend Tests

This guide covers everything you need to set up to run the backend tests successfully in GitHub Actions.

## 🔧 Required Setup

### 1. **MongoDB Configuration**
**Current Status**: ✅ **Already Handled**
- Tests use `mongomock` (in-memory MongoDB simulation)
- No real MongoDB connection needed for tests
- No additional setup required

### 2. **Firebase Credentials** 
**Status**: ✅ **Already Handled**
- Firebase is mocked in tests using `@pytest.fixture`
- No real Firebase credentials needed for tests
- Tests will run without Firebase configuration

### 3. **Environment Variables**
**Status**: ✅ **Configured**
- Environment variables are set in the GitHub workflow
- Default test values provided for missing secrets

## 🚀 Setup Instructions

### Step 1: GitHub Repository Secrets (OPTIONAL)

You can add these secrets to your GitHub repository for production-like testing:
`Settings` → `Secrets and variables` → `Actions`

#### Optional Secrets (Tests will work without these):
```bash
# JWT Configuration (optional - defaults provided)
SECRET_KEY=your-super-secret-jwt-key-for-testing-32chars-min

# Firebase (optional - mocked in tests)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_TYPE=service_account
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your-client-cert-url
```

### Step 2: Workflow Configuration ✅ DONE

The GitHub workflow has been updated to:
- Set required environment variables with defaults
- Configure proper Python path
- Run tests with verbose output
- Handle missing secrets gracefully

### Step 3: Test Configuration ✅ DONE

The following files have been configured:

#### `pytest.ini`
- Set up test discovery paths
- Configure test markers
- Set up environment file loading

#### `tests/.env.test`
- Default test environment variables
- Mock Firebase credentials
- Test database configuration

#### `tests/conftest.py`
- Firebase mocking fixtures
- Environment variable setup
- Database mocking with mongomock

## 🏃‍♂️ Running Tests

### Locally
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run auth tests only
pytest tests/auth/ -v

# Run with coverage
pytest tests/auth/ --cov=app.auth
```

### In GitHub Actions
Tests will run automatically when:
- You push to `main` branch
- You create a pull request to `main` or `feature/auth-service-workflow`
- You modify files in `backend/` directory

## 🔍 What's Tested

### ✅ Mock Dependencies
- **MongoDB**: Uses `mongomock` for in-memory database
- **Firebase**: Mocked using pytest fixtures
- **JWT**: Uses test secret keys
- **External APIs**: All mocked

### ✅ Test Coverage
- All 7 auth endpoints
- Service layer methods
- Error handling
- Security validations
- Integration flows

## 🚨 Troubleshooting

### Common Issues and Solutions:

#### 1. **Import Errors**
```bash
ModuleNotFoundError: No module named 'app'
```
**Solution**: ✅ Fixed with proper `PYTHONPATH` configuration

#### 2. **Firebase Initialization Errors**
```bash
Firebase app initialization failed
```
**Solution**: ✅ Fixed with Firebase mocking fixtures

#### 3. **Database Connection Errors**
```bash
pymongo.errors.ServerSelectionTimeoutError
```
**Solution**: ✅ Fixed with mongomock usage

#### 4. **Environment Variable Errors**
```bash
KeyError: 'SECRET_KEY'
```
**Solution**: ✅ Fixed with default values in workflow

## 📊 Test Results

When tests run successfully, you'll see:
- ✅ All test files discovered
- ✅ All auth endpoints tested
- ✅ Service methods validated
- ✅ Edge cases covered
- ✅ Security tests passed

Example output:
```
tests/auth/test_auth_routes.py::test_signup_with_email_success PASSED
tests/auth/test_auth_routes.py::test_login_with_email_success PASSED
tests/auth/test_auth_routes.py::test_refresh_token_success PASSED
... (all tests)

====== 50+ tests passed ======
```

## 🎯 Next Steps

### For Production Deployment:
1. **Set up real MongoDB** connection
2. **Configure Firebase** with production credentials
3. **Set production JWT secrets**
4. **Configure CORS** for your frontend domain
5. **Set up monitoring** and logging

### For Development:
1. **Run tests locally** to verify setup
2. **Add new test cases** as you develop features
3. **Monitor test coverage** with coverage reports
4. **Keep dependencies updated**

## 📝 Summary

**Status**: ✅ **READY TO RUN**

Your tests are now configured to run in GitHub Actions without requiring any additional setup. The workflow will:

1. ✅ Install Python and dependencies
2. ✅ Set up test environment with defaults
3. ✅ Mock external dependencies (Firebase, MongoDB)
4. ✅ Run comprehensive test suite
5. ✅ Report results and failures

**No additional secrets or external services required!**
