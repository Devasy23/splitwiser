# Splitwiser Frontend

A React Native (Expo) application for the Splitwiser bill-splitting app.

## Features

- User authentication (email/password and Google Sign-in)
- Login and signup screens
- JWT authentication with refresh token mechanism
- Secure token storage

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Install dependencies:

```bash
cd frontend
npm install
# or
yarn install
```

2. Configure environment variables:
   
   - Update the API_URL in `contexts/AuthContext.tsx` with your backend URL.
   - Update the `WEB_CLIENT_ID` in `config/firebase.tsx` with your Firebase Web Client ID.

3. Start the development server:

```bash
npm start
# or 
yarn start
# or
npx expo start
```

### Running on Physical Device

1. Install Expo Go app on your iOS or Android device
2. Scan the QR code shown in the terminal after running `npm start`

### Running on Emulator

- For Android: Press 'a' in the terminal after starting the development server
- For iOS: Press 'i' in the terminal (requires macOS and Xcode)

## Authentication Flow

This app follows the authentication flow as described in [auth-service.md](../docs/auth-service.md):

1. **Email/Password Authentication**
   - Sign up with email, password, and name
   - Login with email and password
   
2. **Google Authentication**
   - Uses Firebase for Google authentication
   - Sends the ID token to the backend for verification
   
3. **Token Management**
   - Stores access tokens in memory
   - Stores refresh tokens securely using Expo SecureStore
   - Auto-refreshes expired tokens
   - Handles token rotation

## Project Structure

- `/screens` - React Native screens (LoginScreen, HomeScreen)
- `/contexts` - React Context for global state management (AuthContext)
- `/config` - Configuration files (Firebase)
- `/assets` - Images and other static assets
