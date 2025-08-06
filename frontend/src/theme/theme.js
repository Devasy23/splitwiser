import { MD3LightTheme } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  roundness: 8, // Reduced border radius for modern, minimal look
  colors: {
    ...MD3LightTheme.colors,
    // Modern color updates for cleaner appearance
    surface: '#ffffff',
    surfaceVariant: '#f5f5f7',
    outline: '#e1e1e6',
    primary: '#007AFF', // iOS-style blue for modern feel
    primaryContainer: '#e8f4ff',
  },
  // Custom theme values for consistent styling
  custom: {
    borderRadius: 8, // Reduced from 12 to 8 for more subtle, modern corners
    borderRadiusSmall: 6, // For smaller elements like chips, badges
    borderRadiusLarge: 12, // For modals and major containers only
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    // Modern shadows for depth
    shadow: {
      small: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      medium: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    },
  },
};

export default theme;
