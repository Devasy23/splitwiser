# Expo Setup Guide - Splitwiser Mobile App

## Overview
This guide provides comprehensive instructions to set up, run, and troubleshoot the Splitwiser Expo/React Native mobile application.

## Prerequisites

### System Requirements
- **Node.js**: v16 or higher (tested with v24.2.0)
- **npm**: v7 or higher (tested with v11.3.0) 
- **Mobile Device**: iOS or Android with Expo Go app installed
- **Operating System**: Windows, macOS, or Linux

### Required Software Installation

#### 1. Node.js and npm
- Download from [nodejs.org](https://nodejs.org/)
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

#### 2. Expo CLI
Install the latest Expo CLI globally:
```bash
npm install -g @expo/cli
```

#### 3. Expo Go Mobile App
- **iOS**: Download from App Store
- **Android**: Download from Google Play Store

## Setup Instructions

### Step 1: Clone Repository
```bash
git clone https://github.com/Devasy23/splitwiser.git
cd splitwiser
```

### Step 2: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 3: Install Dependencies
```bash
npm install
```

**Note**: You may see deprecation warnings - these are normal and don't affect functionality.

### Step 4: Create Assets Directory
If not present, create the assets directory:
```bash
mkdir assets
```

### Step 5: Start Development Server
```bash
npx expo start
```

## Running the App

### Option 1: Physical Device (Recommended)
1. Ensure your mobile device is connected to the same Wi-Fi network as your computer
2. Open Expo Go app on your device
3. Scan the QR code displayed in the terminal
4. Wait for the app to load

### Option 2: Android Emulator
1. Start the development server: `npx expo start`
2. Press `a` in the terminal to open Android emulator
3. Requires Android Studio and emulator setup

### Option 3: iOS Simulator (macOS only)
1. Start the development server: `npx expo start`
2. Press `i` in the terminal to open iOS simulator
3. Requires Xcode installation

### Option 4: Web Browser
1. Start the development server: `npx expo start`
2. Press `w` in the terminal to open in web browser
3. Note: Some mobile-specific features may not work

## Current Configuration

### App Configuration (app.json)
```json
{
  "expo": {
    "name": "Splitwiser",
    "slug": "splitwiser",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "splitwiser"
  }
}
```

### Backend Configuration
- **API URL**: `https://splitwiser-production.up.railway.app`
- **Authentication**: JWT with refresh token mechanism
- **Secure Storage**: Expo SecureStore for refresh tokens

## Troubleshooting

### Common Issues and Solutions

#### 1. "expo command not found"
**Solution**: Install Expo CLI globally:
```bash
npm install -g @expo/cli
```

#### 2. "Unable to find expo in this project"
**Solution**: Ensure you're in the frontend directory and dependencies are installed:
```bash
cd frontend
npm install
```

#### 3. Metro bundler fails to start
**Solution**: Clear npm cache and reinstall:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 4. QR code not scanning
**Solutions**:
- Ensure both devices are on the same Wi-Fi network
- Try typing the tunnel URL manually in Expo Go
- Use `npx expo start --tunnel` for network issues

#### 5. App crashes on device
**Solutions**:
- Check terminal for error logs
- Ensure all dependencies are properly installed
- Restart the development server
- Clear Expo Go app cache

#### 6. Assets not loading
**Solution**: Ensure assets directory exists and contains required files:
```bash
mkdir assets
```

#### 7. Network request failed
**Possible Causes**:
- Backend server is down
- Network connectivity issues
- Incorrect API URL configuration

**Solutions**:
- Verify backend server status
- Check network connection
- Update API_URL in `contexts/AuthContext.tsx` if needed

### Development Commands Reference

| Command | Description |
|---------|-------------|
| `npx expo start` | Start development server |
| `npx expo start --clear` | Start with cleared cache |
| `npx expo start --tunnel` | Start with tunnel (for network issues) |
| `npx expo install` | Install Expo-compatible packages |
| `npx expo doctor` | Check for common issues |

### Performance Tips

1. **Faster Development**:
   - Use physical device instead of emulator
   - Enable Fast Refresh for instant code updates
   - Use development build for better performance

2. **Network Optimization**:
   - Use same Wi-Fi network for device and computer
   - Consider using tunnel mode for complex networks
   - Enable offline mode in Expo Go when possible

## Environment Variables

Currently, the app uses hardcoded configuration. For production deployment, consider:

1. **API Configuration**: Update `API_URL` in `contexts/AuthContext.tsx`
2. **Firebase Configuration**: Update Web Client ID if using Google authentication
3. **Security**: Use environment variables for sensitive configuration

## Development Workflow

1. **Code Changes**: Make changes to React Native components
2. **Auto Reload**: Expo automatically reloads the app with changes
3. **Debugging**: Use React Native debugger or browser dev tools
4. **Testing**: Test on multiple devices and screen sizes
5. **Build**: Use `expo build` for production builds

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Go App](https://expo.dev/tools#client)
- [Expo CLI Reference](https://docs.expo.dev/workflow/expo-cli/)

## Support

For issues specific to this project:
1. Check existing issues in the GitHub repository
2. Review this troubleshooting guide
3. Check Expo documentation for platform-specific issues
4. Create a new issue with detailed error logs

---

**Last Updated**: July 2025  
**Tested Environment**: Windows with Node.js v24.2.0, npm v11.3.0, Expo CLI latest
