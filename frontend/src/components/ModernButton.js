import { Button as PaperButton } from 'react-native-paper';
import { useAppTheme } from '../theme/useAppTheme';

/**
 * Modern Button component with consistent styling
 * Provides clean, minimal button designs
 */
const ModernButton = ({ style, mode = 'contained', children, ...props }) => {
  const { theme } = useAppTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: theme.custom.borderRadius,
    };

    switch (mode) {
      case 'contained':
        return {
          ...baseStyle,
          // Use theme's primary color
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1.5, // Slightly thicker border for better visibility
        };
      case 'text':
        return {
          ...baseStyle,
          // Minimal styling for text buttons
        };
      default:
        return baseStyle;
    }
  };

  return (
    <PaperButton 
      mode={mode}
      style={[getButtonStyle(), style]}
      {...props}
    >
      {children}
    </PaperButton>
  );
};

export default ModernButton;
