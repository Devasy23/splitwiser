#!/bin/bash

# Test verification script for Splitwiser backend
# Run this script to verify your test setup before pushing to GitHub

echo "🚀 Splitwiser Backend Test Verification"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the backend/ directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "✅ Found requirements.txt"

# Check Python version
echo ""
echo "🐍 Python Version Check:"
python --version
if [ $? -ne 0 ]; then
    echo "❌ Error: Python not found. Please install Python 3.9+"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing Dependencies:"
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed successfully"

# Check if pytest is available
echo ""
echo "🧪 Pytest Check:"
python -m pytest --version
if [ $? -ne 0 ]; then
    echo "❌ Error: Pytest not available"
    exit 1
fi
echo "✅ Pytest available"

# Check test discovery
echo ""
echo "🔍 Test Discovery:"
python -m pytest --collect-only tests/auth/ -q
if [ $? -ne 0 ]; then
    echo "❌ Error: Test discovery failed"
    exit 1
fi
echo "✅ Tests discovered successfully"

# Run a quick test
echo ""
echo "⚡ Quick Test Run:"
python -m pytest tests/auth/test_auth_routes.py::test_signup_with_email_success -v
if [ $? -ne 0 ]; then
    echo "❌ Error: Quick test failed"
    echo "💡 This might indicate missing dependencies or configuration issues"
    exit 1
fi
echo "✅ Quick test passed"

# Run all auth tests
echo ""
echo "🧪 Running All Auth Tests:"
python -m pytest tests/auth/ -v --tb=short
if [ $? -ne 0 ]; then
    echo "❌ Some tests failed. Check output above for details."
    echo "💡 This might be due to:"
    echo "   - Missing environment variables"
    echo "   - Import errors"
    echo "   - Configuration issues"
    exit 1
fi

echo ""
echo "🎉 SUCCESS! All tests passed!"
echo "✅ Your test setup is ready for GitHub Actions"
echo ""
echo "📋 Summary:"
echo "   - Python environment: ✅"
echo "   - Dependencies: ✅"
echo "   - Test discovery: ✅"
echo "   - Test execution: ✅"
echo "   - All auth tests: ✅"
echo ""
echo "🚀 You can now push to GitHub with confidence!"
