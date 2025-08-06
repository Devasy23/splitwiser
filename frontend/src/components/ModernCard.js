import { Card as PaperCard } from 'react-native-paper';
import { useAppTheme } from '../theme/useAppTheme';

/**
 * Modern Card component with consistent styling
 * Provides a clean, minimal design with subtle shadows
 */
const ModernCard = ({ children, style, variant = 'default', ...props }) => {
  const { theme } = useAppTheme();

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.custom.borderRadius,
      ...theme.custom.shadow.small,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...theme.custom.shadow.medium,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          shadowOpacity: 0, // Remove shadow for outlined variant
          elevation: 0,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <PaperCard 
      style={[getCardStyle(), style]} 
      {...props}
    >
      {children}
    </PaperCard>
  );
};

export default ModernCard;
