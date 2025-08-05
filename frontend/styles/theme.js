import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import merge from 'deepmerge';
import React, { useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
} from 'react-native-paper';

// Only import Material You theming on Android platform
let useMaterial3Theme;
if (Platform.OS === 'android') {
  try {
    ({ useMaterial3Theme } = require('@pchmn/expo-material3-theme'));
  } catch (error) {
    console.warn('Material You theming not available:', error);
    useMaterial3Theme = () => ({ theme: null });
  }
} else {
  // Mock the hook for web and other platforms
  useMaterial3Theme = () => ({ theme: null });
}

export const PreferencesContext = React.createContext(null);

// Create a manual theme adapter for React Navigation to avoid import issues
const createAdaptedTheme = (paperTheme, navigationTheme) => ({
  ...navigationTheme,
  colors: {
    ...navigationTheme.colors,
    primary: paperTheme.colors.primary,
    background: paperTheme.colors.background,
    card: paperTheme.colors.surface,
    text: paperTheme.colors.onSurface,
    border: paperTheme.colors.outline,
    notification: paperTheme.colors.error,
  },
});

// Create adapted navigation themes
const LightNavigationTheme = createAdaptedTheme(MD3LightTheme, NavigationDefaultTheme);
const DarkNavigationTheme = createAdaptedTheme(MD3DarkTheme, NavigationDarkTheme);

// Create combined themes by merging Paper and Navigation themes
const CombinedDefaultTheme = merge(MD3LightTheme, LightNavigationTheme);
const CombinedDarkTheme = merge(MD3DarkTheme, DarkNavigationTheme);

export const useAppTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Only use Material You dynamic theming on supported platforms (Android 12+)
  const materialYouTheme = useMaterial3Theme();

  const paperTheme = useMemo(() => {
    const baseTheme = isDark ? CombinedDarkTheme : CombinedDefaultTheme;
    
    // Only apply Material You colors if available and we're on a supported platform
    if (materialYouTheme.theme && Platform.OS === 'android') {
      const dynamicColors = isDark ? materialYouTheme.theme.dark : materialYouTheme.theme.light;
      return {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          ...dynamicColors,
        },
      };
    }

    // Return the base combined theme for web and other platforms
    return baseTheme;
  }, [colorScheme, materialYouTheme.theme, isDark]);

  return paperTheme;
};
