import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import AppNavigator from '@/navigation/AppNavigator';
import { darkTheme, lightTheme } from '@/styles/theme';

export default function App() {
  // For now, we'll use light theme. In a real app, you'd get this from user preferences
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <AppNavigator />
        </PaperProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
