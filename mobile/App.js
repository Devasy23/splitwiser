import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
