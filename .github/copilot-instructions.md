# Splitwiser - AI Coding Guide

This document provides essential context for AI assistants working with the Splitwiser codebase.

## Project Overview

Splitwiser is an expense tracking and splitting application with:
- Backend: FastAPI + MongoDB 
- Frontend: Expo/React Native mobile app

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

### Frontend (Expo/React Native)
- Located in `/frontend/`
- `App.js`: Main application entry point
- `screens/`: Contains all screen components
- `navigation/`: App navigation structure
- `api/`: API client and service modules
- `context/`: React context providers (AuthContext)
- `utils/`: Utility functions (currency, balance calculations)

## Key Development Patterns

### API Communication
```javascript
// Example API call from frontend/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});
```

### State Management
- Backend: MongoDB stores persistent data
- Frontend: React Context for auth state, component state for UI

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
2. Frontend:
   ```bash
   cd frontend
   npm install
   npx expo start
   ```

### Testing
- Backend tests in `/backend/tests/`
- Run tests with: `cd backend && pytest`

## Critical Files & Dependencies

- `backend/main.py`: Main FastAPI application entry point
- `backend/app/config.py`: Configuration settings
- `backend/app/database.py`: MongoDB connection
- `frontend/App.js`: Main React Native entry point
- `frontend/context/AuthContext.js`: Authentication state management

## Common Tasks

- Adding new API endpoint: Add route to appropriate service router file in `backend/app/`
- Adding new screen: Create component in `frontend/screens/` and add to navigation
- API integration: Add service functions in `frontend/api/`
- Troubleshooting auth: Check JWT token handling in `backend/app/auth/security.py`
