import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <ErrorBoundary>
          <AppNavigator />
        </ErrorBoundary>
      </PaperProvider>
    </AuthProvider>
  );
}
