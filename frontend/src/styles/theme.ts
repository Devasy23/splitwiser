import { Material3Theme } from '@/types';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Material 3 Color Scheme - You can customize these colors
const material3Colors = {
  light: {
    primary: '#006A6B',
    onPrimary: '#FFFFFF',
    primaryContainer: '#6FF7F8',
    onPrimaryContainer: '#002020',
    secondary: '#4A6363',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CCE8E7',
    onSecondaryContainer: '#051F1F',
    tertiary: '#456179',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#CCE5FF',
    onTertiaryContainer: '#001E31',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: '#FAFDFC',
    onBackground: '#191C1C',
    surface: '#FAFDFC',
    onSurface: '#191C1C',
    surfaceVariant: '#DAE5E4',
    onSurfaceVariant: '#3F4948',
    outline: '#6F7979',
    outlineVariant: '#BEC9C8',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#2D3131',
    inverseOnSurface: '#EFF1F1',
    inversePrimary: '#4DDADB',
  },
  dark: {
    primary: '#4DDADB',
    onPrimary: '#003738',
    primaryContainer: '#004F50',
    onPrimaryContainer: '#6FF7F8',
    secondary: '#B0CCCB',
    onSecondary: '#1B3534',
    secondaryContainer: '#324B4A',
    onSecondaryContainer: '#CCE8E7',
    tertiary: '#A8CAE6',
    onTertiary: '#0F344A',
    tertiaryContainer: '#2C4B61',
    onTertiaryContainer: '#CCE5FF',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    background: '#0F1414',
    onBackground: '#DFE3E2',
    surface: '#0F1414',
    onSurface: '#DFE3E2',
    surfaceVariant: '#3F4948',
    onSurfaceVariant: '#BEC9C8',
    outline: '#889392',
    outlineVariant: '#3F4948',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#DFE3E2',
    inverseOnSurface: '#2D3131',
    inversePrimary: '#006A6B',
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...material3Colors.light,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...material3Colors.dark,
  },
};

export const theme: Material3Theme = {
  light: lightTheme,
  dark: darkTheme,
};
