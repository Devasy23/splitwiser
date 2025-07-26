#!/bin/bash

# Splitwiser Frontend Quick Setup Script
# This script automates the setup process documented in EXPO_SETUP_GUIDE.md

echo "🚀 Splitwiser Frontend Quick Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Navigate to frontend directory
if [ ! -d "frontend" ]; then
    echo "❌ frontend directory not found. Make sure you're in the splitwiser root directory."
    exit 1
fi

cd frontend

echo "📂 Navigated to frontend directory"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create assets directory if it doesn't exist
if [ ! -d "assets" ]; then
    mkdir assets
    echo "📁 Created assets directory"
fi

# Install Expo CLI globally if not present
if ! command -v expo &> /dev/null; then
    echo "🔧 Installing Expo CLI globally..."
    npm install -g @expo/cli
    
    if [ $? -ne 0 ]; then
        echo "⚠️  Failed to install Expo CLI globally. You may need to run this with sudo or as administrator."
        echo "   Manual installation: npm install -g @expo/cli"
    else
        echo "✅ Expo CLI installed successfully"
    fi
else
    echo "✅ Expo CLI already installed"
fi

# Check for security vulnerabilities
echo "🔍 Checking for security vulnerabilities..."
npm audit --audit-level=moderate

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📱 Next steps:"
echo "1. Start the development server: npx expo start"
echo "2. Install Expo Go app on your mobile device"
echo "3. Scan the QR code to run the app"
echo ""
echo "📚 For detailed instructions, see: docs/EXPO_SETUP_GUIDE.md"
echo "📊 For complete analysis, see: docs/EXECUTIVE_SUMMARY.md"
