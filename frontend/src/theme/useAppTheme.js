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
    borderRadius: theme?.custom?.borderRadius || 8,
    spacing: theme?.custom?.spacing || { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    
    // Common container styles with modern design
    getCardStyle: (customStyles = {}) => ({
      borderRadius: theme?.custom?.borderRadius || 8,
      backgroundColor: theme?.colors?.surface || '#ffffff',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      ...customStyles,
    }),
    
    getModalStyle: (customStyles = {}) => ({
      backgroundColor: theme?.colors?.surface || '#ffffff',
      padding: theme?.custom?.spacing?.lg || 24,
      margin: theme?.custom?.spacing?.lg || 24,
      borderRadius: theme?.custom?.borderRadiusLarge || 12, // Use larger radius only for modals
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      ...customStyles,
    }),
    
    getSectionStyle: (backgroundColor, borderColor, customStyles = {}) => ({
      backgroundColor: backgroundColor || theme?.colors?.surfaceVariant || '#f5f5f7',
      borderRadius: theme?.custom?.borderRadius || 8,
      padding: theme?.custom?.spacing?.md || 16,
      borderLeftWidth: 3, // Reduced from 4 for more subtle accent
      borderLeftColor: borderColor,
      ...customStyles,
    }),

    // Modern input styles
    getInputStyle: (customStyles = {}) => ({
      backgroundColor: theme?.colors?.surface || '#ffffff',
      ...customStyles,
    }),

    // Clean button styles
    getButtonStyle: (variant = 'contained', customStyles = {}) => ({
      borderRadius: theme?.custom?.borderRadius || 8,
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
