# Splitwiser Backend

This is the FastAPI backend for the Splitwiser expense tracking application.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Update the environment variables:
     - `MONGODB_URL`: Your MongoDB connection string
     - `SECRET_KEY`: A secure secret key for JWT tokens
     - `FIREBASE_PROJECT_ID`: Your Firebase project ID
     - `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to your Firebase service account JSON file

3. **Firebase Setup:**
   - Place your `firebase-service-account.json` file in the backend directory
   - This file is required for Google authentication to work

4. **Run the server:**
   ```bash
   # Development
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   
   # Or using Python
   python main.py
   ```

5. **Access the API:**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Authentication Endpoints

The following authentication endpoints are available:

- `POST /auth/signup/email` - Register with email/password
- `POST /auth/login/email` - Login with email/password  
- `POST /auth/login/google` - Login/signup with Google OAuth
- `POST /auth/refresh` - Refresh access token
- `POST /auth/token/verify` - Verify access token
- `POST /auth/password/reset/request` - Request password reset
- `POST /auth/password/reset/confirm` - Confirm password reset

### Using Authenticated Endpoints

To test protected endpoints that require a user to be logged in, follow these steps:

1.  **Sign Up**: Create a user account using the `POST /auth/signup/email` endpoint.
2.  **Log In**: Use the `POST /auth/login/email` endpoint with the same credentials.
3.  **Copy Token**: From the successful login response, copy the `access_token` value.
4.  **Authorize**: In the FastAPI docs (`/docs`), click the top-right "Authorize" button. In the popup, paste your token in the format `Bearer <your_token>`.
5.  **Test**: You can now successfully test any protected endpoint (e.g., `GET /users/me`).


## Database

The application uses MongoDB for data storage. Make sure MongoDB is running and accessible via the connection string in your `.env` file.

## Logging Configuration
The logging configuration is defined in the `app/config.py` file. It includes:
- **Log Levels**: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- **Format**: Logs include timestamps, log levels, and messages.
- **Handlers**: Logs are output to the console.

## Project Structure

```
backend/
├── app/
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── routes.py      # Auth API endpoints
│   │   ├── schemas.py     # Pydantic models
│   │   ├── security.py    # JWT and password utilities
│   │   └── service.py     # Auth business logic
│   ├── __init__.py
│   ├── config.py          # Configuration settings
│   ├── database.py        # MongoDB connection
│   └── dependencies.py    # FastAPI dependencies
├── main.py                # FastAPI application
├── requirements.txt       # Python dependencies
└── .env.example          # Environment variables template
```
