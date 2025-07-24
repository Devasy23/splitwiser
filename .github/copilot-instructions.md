# Splitwiser - AI Coding Guide

This document provides essential context for AI assistants working with the Splitwiser codebase.

## Project Overview

Splitwiser is an expense tracking and splitting application with:
- Backend: FastAPI + MongoDB 
- Frontend POC: Streamlit
- Frontend: Expo/React Native (implemented with Google/Firebase authentication)

The app allows users to create groups, add expenses with flexible splitting options, track balances, and handle settlements.

## Architecture

### Backend (FastAPI)
- Located in `/backend/`
- RESTful API using FastAPI with Python 3.9+
- MongoDB for database (nonrelational schema)
- JWT authentication with refresh token rotation
- Modular design with services:
  - `app/auth/`: Authentication & user registration
  - `app/user/`: User profile management
  - `app/groups/`: Group creation & management
  - `app/expenses/`: Expense tracking & splitting
  
### Frontend POC (Streamlit)
- Located in `/ui-poc/`
- `Home.py`: Entry point with login/registration
- `pages/`: Contains main application pages
  - `Groups.py`: Group management & expense creation 
  - `Friends.py`: Friend balance tracking

## Key Development Patterns

### API Communication
```python
# Example API call with retry logic from Groups.py
response = make_api_request(
    method="get",
    url=f"{API_URL}/groups/{group_id}",
    headers={"Authorization": f"Bearer {st.session_state.access_token}"},
    max_retries=3
)
```

### State Management
- Backend: MongoDB stores persistent data
- Frontend: Streamlit session state manages user session
```python
# Session state initialization (see Home.py)
if "access_token" not in st.session_state:
    st.session_state.access_token = None
```

### Expense Handling
- Support for different split types: equal, unequal, percentage-based
- Each expense has a payer and multiple splits (recipients)
- Settlements track debt resolution between users

## Developer Workflows

### Setup & Running
1. Backend: 
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
2. Frontend POC:
   ```bash
   cd ui-poc
   pip install -r requirements.txt
   streamlit run Home.py
   ```
3. Test Data Generation:
   ```bash
   cd ui-poc
   python setup_test_data.py
   ```

### Testing
- Backend tests in `/backend/tests/`
- Run tests with: `cd backend && pytest`
- Test data setup script: `/ui-poc/setup_test_data.py`

## Critical Files & Dependencies

- `backend/main.py`: Main FastAPI application entry point
- `backend/app/config.py`: Configuration settings
- `backend/app/database.py`: MongoDB connection
- `ui-poc/Home.py`: Streamlit application entry point
- `ui-poc/openapi.json`: API specification for frontend reference

## Common Tasks

- Adding new API endpoint: Add route to appropriate service router file
- Adding new UI component: Modify files in `/ui-poc/pages/`
- Testing data flow: Use the `setup_test_data.py` to create test scenarios
- Troubleshooting auth: Check JWT token handling in `app/auth/security.py`
