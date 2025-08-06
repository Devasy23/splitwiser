import { MD3LightTheme } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  roundness: 12, // This sets the consistent border radius for all Paper components
  colors: {
    ...MD3LightTheme.colors,
    // You can customize colors here if needed
  },
  // Custom theme values for consistent styling
  custom: {
    borderRadius: 12, // For custom components that don't use Paper's roundness
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  },
};

export default theme;
