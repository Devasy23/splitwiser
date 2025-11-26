# Splitwiser - AI Coding Guide

This document provides essential context for AI assistants working with the Splitwiser codebase.

## Project Overview

Splitwiser is an expense tracking and splitting application with:
- Backend: FastAPI + MongoDB 
- Mobile: Expo/React Native mobile app
- Web: React + Vite + TypeScript web app

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

### Mobile (Expo/React Native)
- Located in `/mobile/`
- `App.js`: Main application entry point
- `screens/`: Contains all screen components
- `navigation/`: App navigation structure
- `api/`: API client and service modules
- `context/`: React context providers (AuthContext)
- `utils/`: Utility functions (currency, balance calculations)

### Web (React + Vite + TypeScript)
- Located in `/web/`
- `App.tsx`: Main application entry point
- `pages/`: Contains page components
- `components/`: Reusable UI components
- `contexts/`: React context providers
- `services/`: API client and service modules

## Key Development Patterns

### API Communication
```javascript
// Example API call from mobile/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});
```

### State Management
- Backend: MongoDB stores persistent data
- Mobile/Web: React Context for auth state, component state for UI

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
2. Mobile:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
3. Web:
   ```bash
   cd web
   npm install
   npm run dev
   ```

### Testing
- Backend tests in `/backend/tests/`
- Run tests with: `cd backend && pytest`

## Critical Files & Dependencies

- `backend/main.py`: Main FastAPI application entry point
- `backend/app/config.py`: Configuration settings
- `backend/app/database.py`: MongoDB connection
- `mobile/App.js`: Main React Native entry point
- `mobile/context/AuthContext.js`: Authentication state management
- `web/App.tsx`: Main web app entry point
- `web/contexts/AuthContext.tsx`: Web authentication state management

## Common Tasks

- Adding new API endpoint: Add route to appropriate service router file in `backend/app/`
- Adding new mobile screen: Create component in `mobile/screens/` and add to navigation
- Adding new web page: Create component in `web/pages/` and add to routing
- API integration: Add service functions in `mobile/api/` or `web/services/`
- Troubleshooting auth: Check JWT token handling in `backend/app/auth/security.py`
