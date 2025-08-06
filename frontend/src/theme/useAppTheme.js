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
    
    // Common container styles with modern design
    getCardStyle: (customStyles = {}) => ({
      borderRadius: theme.custom.borderRadius,
      backgroundColor: theme.colors.surface,
      ...theme.custom.shadow.small,
      ...customStyles,
    }),
    
    getModalStyle: (customStyles = {}) => ({
      backgroundColor: theme.colors.surface,
      padding: theme.custom.spacing.lg,
      margin: theme.custom.spacing.lg,
      borderRadius: theme.custom.borderRadiusLarge, // Use larger radius only for modals
      ...theme.custom.shadow.medium,
      ...customStyles,
    }),
    
    getSectionStyle: (backgroundColor, borderColor, customStyles = {}) => ({
      backgroundColor: backgroundColor || theme.colors.surfaceVariant,
      borderRadius: theme.custom.borderRadius,
      padding: theme.custom.spacing.md,
      borderLeftWidth: 3, // Reduced from 4 for more subtle accent
      borderLeftColor: borderColor,
      ...customStyles,
    }),

    // Modern input styles
    getInputStyle: (customStyles = {}) => ({
      backgroundColor: theme.colors.surface,
      ...customStyles,
    }),

    // Clean button styles
    getButtonStyle: (variant = 'contained', customStyles = {}) => ({
      borderRadius: theme.custom.borderRadius,
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
