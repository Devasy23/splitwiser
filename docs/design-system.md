# SplitWiser: Material 3 Design System

## Overview
This document defines the Material 3 design system implementation for SplitWiser, ensuring consistent visual design and user experience across the mobile application.

## Color System

### Primary Color Palette
```typescript
const colors = {
  primary: {
    primary: '#6750A4',      // Main brand color
    onPrimary: '#FFFFFF',    // Text/icons on primary
    primaryContainer: '#EADDFF', // Primary container background
    onPrimaryContainer: '#21005D', // Text on primary container
  },
  
  secondary: {
    secondary: '#625B71',     // Secondary brand color
    onSecondary: '#FFFFFF',   // Text/icons on secondary
    secondaryContainer: '#E8DEF8', // Secondary container
    onSecondaryContainer: '#1D192B', // Text on secondary container
  },
  
  tertiary: {
    tertiary: '#7D5260',      // Accent color
    onTertiary: '#FFFFFF',    // Text/icons on tertiary
    tertiaryContainer: '#FFD8E4', // Tertiary container
    onTertiaryContainer: '#31111D', // Text on tertiary container
  },
  
  error: {
    error: '#BA1A1A',         // Error states
    onError: '#FFFFFF',       // Text on error
    errorContainer: '#FFDAD6', // Error container
    onErrorContainer: '#410002', // Text on error container
  },
  
  success: {
    success: '#006A6B',       // Success states (custom)
    onSuccess: '#FFFFFF',     // Text on success
    successContainer: '#6FF7F8', // Success container
    onSuccessContainer: '#001F1F', // Text on success container
  },
  
  neutral: {
    background: '#FFFBFE',    // Main background
    onBackground: '#1C1B1F',  // Text on background
    surface: '#FFFBFE',       // Surface color
    onSurface: '#1C1B1F',     // Text on surface
    surfaceVariant: '#E7E0EC', // Surface variant
    onSurfaceVariant: '#49454F', // Text on surface variant
    outline: '#79747E',       // Outline/border color
    outlineVariant: '#CAC4D0', // Subtle outline
    inverseSurface: '#313033', // Dark surface
    inverseOnSurface: '#F4EFF4', // Text on dark surface
    inversePrimary: '#D0BCFF', // Primary on dark surface
  },
  
  shadow: '#000000',          // Shadow color
  scrim: '#000000',           // Scrim overlay
};
```

### Dark Mode Colors
```typescript
const darkColors = {
  primary: {
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
  },
  
  secondary: {
    secondary: '#CCC2DC',
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
  },
  
  // ... additional dark mode colors
  
  neutral: {
    background: '#1C1B1F',
    onBackground: '#E6E1E5',
    surface: '#1C1B1F',
    onSurface: '#E6E1E5',
    surfaceVariant: '#49454F',
    onSurfaceVariant: '#CAC4D0',
    outline: '#938F99',
    outlineVariant: '#49454F',
  },
};
```

### Semantic Color Usage
- **Financial Positive**: `success` palette (money owed to you)
- **Financial Negative**: `error` palette (money you owe)
- **Financial Neutral**: `outline` color (balanced/no debt)
- **Interactive Elements**: `primary` palette
- **Secondary Actions**: `secondary` palette
- **Destructive Actions**: `error` palette

## Typography System

### Type Scale
```typescript
const typography = {
  displayLarge: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 57,
    lineHeight: 64,
    letterSpacing: -0.25,
    // Usage: Large headers, hero text
  },
  
  displayMedium: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 45,
    lineHeight: 52,
    letterSpacing: 0,
    // Usage: Prominent headers
  },
  
  displaySmall: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0,
    // Usage: Section headers
  },
  
  headlineLarge: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
    // Usage: Screen titles
  },
  
  headlineMedium: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
    // Usage: Card titles, dialog headers
  },
  
  headlineSmall: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
    // Usage: Subsection headers
  },
  
  titleLarge: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    // Usage: App bar titles, card headers
  },
  
  titleMedium: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    // Usage: Component titles, emphasized text
  },
  
  titleSmall: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    // Usage: Dense component titles
  },
  
  labelLarge: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    // Usage: Button text, prominent labels
  },
  
  labelMedium: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    // Usage: Form labels, navigation labels
  },
  
  labelSmall: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
    // Usage: Small labels, captions
  },
  
  bodyLarge: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
    // Usage: Primary body text
  },
  
  bodyMedium: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
    // Usage: Secondary body text
  },
  
  bodySmall: {
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    // Usage: Supporting text, timestamps
  },
};
```

### Font Usage Guidelines
- **Amount Display**: Use `titleLarge` or `headlineSmall` for monetary amounts
- **Screen Titles**: Use `headlineLarge` for main screen titles
- **Card Titles**: Use `titleMedium` for expense and group card titles
- **Body Text**: Use `bodyMedium` for descriptions and content
- **Labels**: Use `labelMedium` for form labels and metadata
- **Buttons**: Use `labelLarge` for button text

## Spacing System

### Spacing Scale
```typescript
const spacing = {
  xs: 4,    // 4dp - Micro spacing
  sm: 8,    // 8dp - Small spacing
  md: 16,   // 16dp - Medium spacing (base unit)
  lg: 24,   // 24dp - Large spacing
  xl: 32,   // 32dp - Extra large spacing
  xxl: 48,  // 48dp - Section spacing
  xxxl: 64, // 64dp - Major section spacing
};
```

### Layout Guidelines
- **Card Padding**: `md` (16dp) internal padding
- **Screen Margins**: `md` (16dp) horizontal margins
- **Section Spacing**: `lg` (24dp) between major sections
- **List Item Spacing**: `sm` (8dp) between list items
- **Form Field Spacing**: `md` (16dp) between form fields
- **Button Spacing**: `sm` (8dp) between buttons in groups

## Component Specifications

### Buttons
```typescript
const buttonStyles = {
  filled: {
    // Primary actions
    backgroundColor: colors.primary.primary,
    color: colors.primary.onPrimary,
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 24,
    elevation: 0,
  },
  
  outlined: {
    // Secondary actions
    backgroundColor: 'transparent',
    color: colors.primary.primary,
    borderColor: colors.neutral.outline,
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 24,
  },
  
  text: {
    // Tertiary actions
    backgroundColor: 'transparent',
    color: colors.primary.primary,
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 16,
  },
  
  fab: {
    // Floating Action Button
    backgroundColor: colors.primary.primaryContainer,
    width: 56,
    height: 56,
    borderRadius: 16,
    elevation: 6,
  },
};
```

### Cards
```typescript
const cardStyles = {
  elevated: {
    backgroundColor: colors.neutral.surface,
    borderRadius: 12,
    elevation: 1,
    marginVertical: 4,
    marginHorizontal: 0,
  },
  
  filled: {
    backgroundColor: colors.neutral.surfaceVariant,
    borderRadius: 12,
    elevation: 0,
    marginVertical: 4,
    marginHorizontal: 0,
  },
  
  outlined: {
    backgroundColor: colors.neutral.surface,
    borderColor: colors.neutral.outline,
    borderWidth: 1,
    borderRadius: 12,
    elevation: 0,
    marginVertical: 4,
    marginHorizontal: 0,
  },
};
```

### Text Fields
```typescript
const textFieldStyles = {
  filled: {
    backgroundColor: colors.neutral.surfaceVariant,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.outline,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  
  outlined: {
    backgroundColor: 'transparent',
    borderColor: colors.neutral.outline,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
};
```

### Navigation
```typescript
const navigationStyles = {
  appBar: {
    backgroundColor: colors.neutral.surface,
    elevation: 0,
    height: 64,
    paddingHorizontal: 16,
  },
  
  bottomNavigation: {
    backgroundColor: colors.neutral.surface,
    borderTopColor: colors.neutral.outlineVariant,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 12,
  },
  
  navigationRail: {
    backgroundColor: colors.neutral.surface,
    width: 80,
    paddingVertical: 16,
  },
};
```

## Elevation System

### Elevation Levels
```typescript
const elevation = {
  level0: 0,   // Surface level
  level1: 1,   // Cards, search bars
  level2: 3,   // Floating action button (resting)
  level3: 6,   // Floating action button (pressed), snackbars
  level4: 8,   // Navigation drawer, modal bottom sheets
  level5: 12,  // Modal dialogs
};
```

### Shadow Styles
```typescript
const shadows = {
  elevation1: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  elevation2: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  
  elevation3: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  
  elevation4: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  
  elevation5: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 12,
  },
};
```

## State Layers

### Interactive States
```typescript
const stateLayers = {
  hover: {
    opacity: 0.08,
    backgroundColor: colors.primary.primary,
  },
  
  focus: {
    opacity: 0.12,
    backgroundColor: colors.primary.primary,
  },
  
  pressed: {
    opacity: 0.12,
    backgroundColor: colors.primary.primary,
  },
  
  dragged: {
    opacity: 0.16,
    backgroundColor: colors.primary.primary,
  },
  
  disabled: {
    opacity: 0.12,
    backgroundColor: colors.neutral.onSurface,
  },
};
```

## Animation Specifications

### Duration Tokens
```typescript
const duration = {
  short1: 50,   // Small utility animations
  short2: 100,  // Small component animations
  short3: 150,  // Small component animations
  short4: 200,  // Standard component animations
  medium1: 250, // Standard component animations
  medium2: 300, // Complex component animations
  medium3: 350, // Complex component animations
  medium4: 400, // Large component animations
  long1: 450,   // Large component animations
  long2: 500,   // Large component animations
  long3: 550,   // Large component animations
  long4: 600,   // Large component animations
  extraLong1: 700, // Emphasis animations
  extraLong2: 800, // Emphasis animations
  extraLong3: 900, // Emphasis animations
  extraLong4: 1000, // Emphasis animations
};
```

### Easing Curves
```typescript
const easing = {
  emphasized: [0.2, 0.0, 0, 1.0],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1.0],
  emphasizedAccelerate: [0.3, 0.0, 0.8, 0.15],
  standard: [0.2, 0.0, 0, 1.0],
  standardDecelerate: [0.0, 0.0, 0, 1.0],
  standardAccelerate: [0.3, 0.0, 1.0, 1.0],
  legacy: [0.4, 0.0, 0.2, 1.0],
  legacyDecelerate: [0.0, 0.0, 0.2, 1.0],
  legacyAccelerate: [0.4, 0.0, 1.0, 1.0],
  linear: [0.0, 0.0, 1.0, 1.0],
};
```

## Responsive Design

### Breakpoints
```typescript
const breakpoints = {
  compact: 0,      // 0-599dp (phones)
  medium: 600,     // 600-839dp (tablets, foldables)
  expanded: 840,   // 840dp+ (large tablets, desktops)
};
```

### Layout Adaptations
- **Compact**: Single column, bottom navigation
- **Medium**: Two columns where appropriate, navigation rail option
- **Expanded**: Multi-column layouts, persistent navigation

## Accessibility

### Color Contrast Requirements
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **UI Elements**: Minimum 3:1 contrast ratio for borders and controls

### Touch Targets
- **Minimum Size**: 44dp x 44dp
- **Recommended Size**: 48dp x 48dp
- **Spacing**: Minimum 8dp between touch targets

### Text Scaling
- Support for system text size preferences
- Test with text scale factors up to 200%
- Ensure layout remains functional at all scales

## Implementation Notes

### React Native Paper Integration
```typescript
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors, // Custom color overrides
  },
  fonts: {
    ...MD3LightTheme.fonts,
    ...typography, // Custom typography
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors, // Custom dark colors
  },
};
```

### Theme Provider Setup
```typescript
import { Provider as PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  return (
    <PaperProvider theme={theme}>
      {/* App content */}
    </PaperProvider>
  );
}
```

This design system ensures consistent visual design and user experience across the SplitWiser mobile application while adhering to Material 3 specifications and best practices.
