@echo off
echo Starting Splitwiser Backend Server...
echo.

@REM REM Check if virtual environment exists
@REM if not exist "venv\" (
@REM     echo Creating virtual environment...
@REM     python -m venv venv
@REM     echo.
@REM )

@REM REM Activate virtual environment
@REM echo Activating virtual environment...
@REM call venv\Scripts\activate.bat
@REM echo.

@REM REM Install dependencies
@REM echo Installing dependencies...
@REM pip install -r requirements.txt
@REM echo.

REM Check if .env file exists
if not exist ".env" (
    echo Warning: .env file not found. Please copy .env.example to .env and configure it.
    echo.
    pause
    exit /b 1
)

REM Start the server
echo Starting FastAPI server...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
