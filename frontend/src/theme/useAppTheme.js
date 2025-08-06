import { useTheme } from 'react-native-paper';

/**
 * Custom hook to get theme-based styles for consistent UI components
 * @returns {object} - Object containing theme and utility functions
 */
export const useAppTheme = () => {
  const theme = useTheme();

  return {
    theme,
    // Utility functions for common styling patterns
    borderRadius: theme.custom.borderRadius,
    spacing: theme.custom.spacing,
    
    // Common container styles
    getCardStyle: (customStyles = {}) => ({
      borderRadius: theme.custom.borderRadius,
      ...customStyles,
    }),
    
    getModalStyle: (customStyles = {}) => ({
      backgroundColor: theme.colors.surface,
      padding: theme.custom.spacing.lg,
      margin: theme.custom.spacing.lg,
      borderRadius: theme.custom.borderRadius,
      ...customStyles,
    }),
    
    getSectionStyle: (backgroundColor, borderColor, customStyles = {}) => ({
      backgroundColor,
      borderRadius: theme.custom.borderRadius,
      padding: theme.custom.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: borderColor,
      ...customStyles,
    }),
  };
};

/**
 * HOC to provide theme-based styles to any component
 * @param {function} createStyles - Function that takes theme and returns StyleSheet
 * @returns {object} - Styles object
 */
export const createThemedStyles = (createStylesFunc) => (theme) => createStylesFunc(theme);
