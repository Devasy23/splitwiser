# Splitwiser Frontend

A React Native (Expo) application for the Splitwiser bill-splitting app.

## 🚀 Current Status

**Implementation Progress**: ~5% Complete (Authentication Foundation)
- ✅ **Authentication System**: Fully functional with JWT, secure storage, and auto-refresh
- ✅ **Professional UI**: Clean, responsive design with consistent branding
- ✅ **Project Setup**: Modern React Native/Expo configuration
- ❌ **Core Features**: Groups, expenses, and balances not yet implemented

## 📱 Features Implemented

### Authentication & Security
- ✅ Email/password registration and login
- ✅ JWT authentication with automatic token refresh
- ✅ Secure token storage using Expo SecureStore
- ✅ Session persistence and proper logout
- ✅ Form validation and error handling

### User Interface
- ✅ Professional login/signup screen with toggle
- ✅ Basic dashboard with user profile display
- ✅ Responsive design with keyboard handling
- ✅ Consistent green theme (#2e7d32)
- ✅ Loading states and error feedback

## 🔮 Planned Features

### Core Bill-Splitting (Not Yet Implemented)
- ❌ Group creation and management
- ❌ Add and split expenses
- ❌ Balance calculations and settlements
- ❌ Receipt photo capture
- ❌ Payment tracking

### Enhanced Navigation (Not Yet Implemented)
- ❌ Bottom tab navigation
- ❌ Nested screen navigation
- ❌ Deep linking support

## 🛠 Getting Started

### Prerequisites

- **Node.js**: v16 or higher (tested with v24.2.0)
- **npm**: v7 or higher (tested with v11.3.0)
- **Expo CLI**: Latest version (`npm install -g @expo/cli`)
- **Mobile Device**: iOS or Android with Expo Go app

### Quick Setup

1. **Clone and navigate**:
```bash
git clone https://github.com/Devasy23/splitwiser.git
cd splitwiser/frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start development server**:
```bash
npx expo start
```

4. **Run on device**:
   - Install Expo Go app on your mobile device
   - Scan the QR code shown in terminal
   - App will load on your device

### Alternative Running Methods

**Android Emulator**: Press `a` in terminal  
**iOS Simulator**: Press `i` in terminal (macOS only)  
**Web Browser**: Press `w` in terminal

## 📖 Documentation

Comprehensive analysis and documentation available in `/docs`:

- **[Setup Guide](docs/EXPO_SETUP_GUIDE.md)**: Complete installation and troubleshooting
- **[Screen Inventory](docs/SCREEN_INVENTORY.md)**: All screens with implementation status
- **[Navigation Map](docs/NAVIGATION_MAP.md)**: Current and planned navigation structure
- **[Component Library](docs/COMPONENT_LIBRARY.md)**: Component analysis and reusability
- **[Feature Analysis](docs/FEATURE_ANALYSIS.md)**: Implemented vs planned features
- **[Architecture Review](docs/ARCHITECTURE_REVIEW.md)**: Code structure and technical analysis
- **[Wireframe Analysis](docs/WIREFRAME_ANALYSIS.md)**: Design implementation comparison
- **[Executive Summary](docs/EXECUTIVE_SUMMARY.md)**: Complete project analysis summary

## 🏗 Current Architecture

### Technology Stack
- **React Native**: 0.72.10
- **Expo**: 49.0.15  
- **TypeScript**: 5.1.3
- **React Navigation**: 6.1.9
- **Axios**: 1.6.2 for API calls
- **Expo SecureStore**: Secure token storage

### Project Structure
```
frontend/
├── App.tsx                 # Root component & navigation
├── screens/               # Screen components
│   ├── LoginScreen.tsx    # Authentication screen
│   └── HomeScreen.tsx     # Dashboard (placeholder)
├── contexts/              # React Context providers
│   └── AuthContext.tsx    # Authentication state
└── docs/                  # Comprehensive documentation
```

### API Integration
- **Backend URL**: `https://splitwiser-production.up.railway.app`
- **Authentication**: JWT with automatic refresh
- **Error Handling**: Comprehensive error catching and user feedback

## 🔧 Development Roadmap

### Phase 1: Foundation (2-3 weeks)
- [ ] Fix security vulnerabilities (`npm audit fix`)
- [ ] Implement bottom tab navigation
- [ ] Create component library foundation
- [ ] Set up testing framework

### Phase 2: Core Features (4-6 weeks)  
- [ ] Group management (create, list, manage members)
- [ ] Expense management (add, split, list expenses)
- [ ] Balance calculations and settlement suggestions

### Phase 3: Enhanced UX (3-4 weeks)
- [ ] Advanced expense features (categories, receipts)
- [ ] Improved navigation and user flows
- [ ] Offline functionality and data caching

## ⚠️ Known Issues

### Security
- **17 npm vulnerabilities** (4 low, 1 moderate, 11 high, 1 critical)
- Run `npm audit fix` to address issues

### Limitations
- No core bill-splitting functionality yet
- Basic navigation structure only
- No testing infrastructure
- Limited offline capabilities

## 🧪 Testing

Currently no tests implemented. Recommended setup:
- **Jest**: Unit testing
- **React Native Testing Library**: Component testing  
- **Detox**: End-to-end testing

## 🚀 Running on Physical Device

1. Install Expo Go app on your iOS or Android device
2. Ensure device and computer are on same Wi-Fi network
3. Scan the QR code shown in terminal after running `npx expo start`
4. App will load and you can test authentication features

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
