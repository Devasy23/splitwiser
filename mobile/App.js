import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_400Regular, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { COLORS } from './constants/theme';
import { View, ActivityIndicator } from 'react-native';

const AppContent = () => {
    const { mode } = useTheme();
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_700Bold,
        SpaceGrotesk_400Regular,
        SpaceGrotesk_700Bold,
    });

    const paperTheme = mode === 'dark'
        ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: COLORS.neo.main, secondary: COLORS.neo.second } }
        : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: COLORS.neo.main, secondary: COLORS.neo.second } };

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.neo.main} />
            </View>
        );
    }

    return (
        <PaperProvider theme={paperTheme}>
            <AppNavigator />
        </PaperProvider>
    );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
          <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
