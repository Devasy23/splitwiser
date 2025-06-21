# Splitwiser App Authentication System

This directory contains the authentication system for the Splitwiser app, which includes:

## Features

- Email/Password Login
- Email/Password Signup
- Google OAuth Authentication
- JWT-based authentication with refresh tokens
- Protected routes

## Implementation Details

### Authentication Flow

1. **Login/Signup Pages**: 
   - Located at `(auth)/login.tsx` and `(auth)/signup.tsx`
   - Both support email/password and Google OAuth authentication

2. **Token Storage**:
   - Access token stored in AsyncStorage
   - Refresh token stored in AsyncStorage
   - User data stored in AsyncStorage

3. **Protected Routes**:
   - The root layout checks for authentication on app start
   - If not authenticated, redirects to the login page

4. **API Integration**:
   - Authentication requests are sent to the backend API
   - Backend responds with access token, refresh token, and user info

## Configuration

Before using Google Sign-In, you need to:

1. Replace the placeholder client IDs in the `GoogleSignInButton.tsx` component with your actual Google client IDs:
   ```typescript
   const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
   const GOOGLE_EXPO_CLIENT_ID = 'YOUR_GOOGLE_EXPO_CLIENT_ID';
   ```

2. Make sure the backend API URL is correctly set in the components:
   ```typescript
   const API_URL = 'https://splitwiser-production.up.railway.app';
   ```

## Usage

After authenticating, the user will be redirected to the home screen which displays:
- User's name
- Dummy balance data
- Logout button

The authentication state persists across app restarts through AsyncStorage.
