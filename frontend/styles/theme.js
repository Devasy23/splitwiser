import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
} from 'react-native-paper';

export const useAppTheme = () => {
    const colorScheme = useColorScheme();
    const { theme } = useMaterial3Theme();

    const paperTheme = useMemo(() => {
      const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
      return {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          ...theme.light,
        },
      };
    }, [colorScheme, theme]);

    return paperTheme;
  };
