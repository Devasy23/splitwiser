import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './context/AuthContext';
import { useAppTheme } from './styles/theme';

const Main = () => {
  const theme = useAppTheme();
  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}
