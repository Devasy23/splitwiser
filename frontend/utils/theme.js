// Centralized theme for react-native-paper (MD3) and React Navigation
// Formal, modern palette suitable for finance/expense tracking, with bold accents

import { DarkTheme as DefaultNavDark, DefaultTheme as DefaultNavTheme } from '@react-navigation/native';
import { MD3DarkTheme as DefaultPaperDark, MD3LightTheme as DefaultPaperTheme } from 'react-native-paper';

const palette = {
  // Neutrals
  background: '#F6F7F9', // light gray background
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  outline: '#E2E8F0',
  // Brand
  primary: '#2563EB', // blue-600
  onPrimary: '#FFFFFF',
  secondary: '#0EA5E9', // sky-500 accent
  tertiary: '#14B8A6', // teal-500
  // Status
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
  info: '#0EA5E9',
  // Text
  text: '#0F172A', // slate-900
  textMuted: '#475569', // slate-600
};

export const paperTheme = {
  ...DefaultPaperTheme,
  colors: {
    ...DefaultPaperTheme.colors,
    primary: palette.primary,
    onPrimary: palette.onPrimary,
    secondary: palette.secondary,
    tertiary: palette.tertiary,
    background: palette.background,
    surface: palette.surface,
    surfaceVariant: palette.surfaceVariant,
    outline: palette.outline,
    error: palette.danger,
    onSurface: palette.text,
    onSurfaceVariant: palette.textMuted,
  },
  roundness: 12,
};

export const navTheme = {
  ...DefaultNavTheme,
  colors: {
    ...DefaultNavTheme.colors,
    primary: palette.primary,
    background: palette.background,
    card: palette.surface,
    text: palette.text,
    border: palette.outline,
    notification: palette.secondary,
  },
};

export const tokens = palette;

// Dark theme variant
const darkPalette = {
  ...palette,
  background: '#0B1220',
  surface: '#0F172A',
  surfaceVariant: '#111827',
  outline: '#1F2937',
  primary: '#3B82F6',
  text: '#E5E7EB',
  textMuted: '#9CA3AF',
};

export const paperThemeDark = {
  ...DefaultPaperDark,
  colors: {
    ...DefaultPaperDark.colors,
    primary: darkPalette.primary,
    onPrimary: darkPalette.onPrimary,
    secondary: darkPalette.secondary,
    tertiary: darkPalette.tertiary,
    background: darkPalette.background,
    surface: darkPalette.surface,
    surfaceVariant: darkPalette.surfaceVariant,
    outline: darkPalette.outline,
    error: darkPalette.danger,
    onSurface: darkPalette.text,
    onSurfaceVariant: darkPalette.textMuted,
  },
  roundness: 12,
};

export const navThemeDark = {
  ...DefaultNavDark,
  colors: {
    ...DefaultNavDark.colors,
    primary: darkPalette.primary,
    background: darkPalette.background,
    card: darkPalette.surface,
    text: darkPalette.text,
    border: darkPalette.outline,
    notification: darkPalette.secondary,
  },
};
