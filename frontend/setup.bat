@echo off
REM Splitwiser Frontend Quick Setup Script (Windows)
REM This script automates the setup process documented in EXPO_SETUP_GUIDE.md

echo 🚀 Splitwiser Frontend Quick Setup
echo ==================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js v16+ from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ npm found
npm --version

REM Navigate to frontend directory
if not exist "frontend" (
    echo ❌ frontend directory not found. Make sure you're in the splitwiser root directory.
    pause
    exit /b 1
)

cd frontend
echo 📂 Navigated to frontend directory

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Create assets directory if it doesn't exist
if not exist "assets" (
    mkdir assets
    echo 📁 Created assets directory
    echo # Assets placeholder > assets\.gitkeep
)

REM Install Expo CLI globally if not present
expo --version >nul 2>&1
if errorlevel 1 (
    echo 🔧 Installing Expo CLI globally...
    npm install -g @expo/cli
    
    if errorlevel 1 (
        echo ⚠️  Failed to install Expo CLI globally. You may need to run this as administrator.
        echo    Manual installation: npm install -g @expo/cli
    ) else (
        echo ✅ Expo CLI installed successfully
    )
) else (
    echo ✅ Expo CLI already installed
)

REM Check for security vulnerabilities
echo 🔍 Checking for security vulnerabilities...
npm audit --audit-level=moderate

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📱 Next steps:
echo 1. Start the development server: npx expo start
echo 2. Install Expo Go app on your mobile device
echo 3. Scan the QR code to run the app
echo.
echo 📚 For detailed instructions, see: docs/EXPO_SETUP_GUIDE.md
echo 📊 For complete analysis, see: docs/EXECUTIVE_SUMMARY.md

pause
