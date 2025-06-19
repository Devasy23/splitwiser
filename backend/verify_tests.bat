@echo off
REM Test verification script for Splitwiser backend (Windows)
REM Run this script to verify your test setup before pushing to GitHub

echo 🚀 Splitwiser Backend Test Verification
echo ======================================

REM Check if we're in the right directory
if not exist "requirements.txt" (
    echo ❌ Error: Please run this script from the backend\ directory
    exit /b 1
)

echo 📁 Current directory: %cd%
echo ✅ Found requirements.txt

REM Check Python version
echo.
echo 🐍 Python Version Check:
python --version
if %errorlevel% neq 0 (
    echo ❌ Error: Python not found. Please install Python 3.9+
    exit /b 1
)

REM Install dependencies
echo.
echo 📦 Installing Dependencies:
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Error: Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed successfully

REM Check if pytest is available
echo.
echo 🧪 Pytest Check:
python -m pytest --version
if %errorlevel% neq 0 (
    echo ❌ Error: Pytest not available
    exit /b 1
)
echo ✅ Pytest available

REM Check test discovery
echo.
echo 🔍 Test Discovery:
python -m pytest --collect-only tests/auth/ -q
if %errorlevel% neq 0 (
    echo ❌ Error: Test discovery failed
    exit /b 1
)
echo ✅ Tests discovered successfully

REM Run a quick test
echo.
echo ⚡ Quick Test Run:
python -m pytest tests/auth/test_auth_routes.py::test_signup_with_email_success -v
if %errorlevel% neq 0 (
    echo ❌ Error: Quick test failed
    echo 💡 This might indicate missing dependencies or configuration issues
    exit /b 1
)
echo ✅ Quick test passed

REM Run all auth tests
echo.
echo 🧪 Running All Auth Tests:
python -m pytest tests/auth/ -v --tb=short
if %errorlevel% neq 0 (
    echo ❌ Some tests failed. Check output above for details.
    echo 💡 This might be due to:
    echo    - Missing environment variables
    echo    - Import errors
    echo    - Configuration issues
    exit /b 1
)

echo.
echo 🎉 SUCCESS! All tests passed!
echo ✅ Your test setup is ready for GitHub Actions
echo.
echo 📋 Summary:
echo    - Python environment: ✅
echo    - Dependencies: ✅
echo    - Test discovery: ✅
echo    - Test execution: ✅
echo    - All auth tests: ✅
echo.
echo 🚀 You can now push to GitHub with confidence!
