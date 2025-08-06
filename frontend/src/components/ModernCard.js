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
      backgroundColor: theme?.colors?.surface || '#ffffff',
      borderRadius: theme?.custom?.borderRadius || 8,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: theme?.colors?.outline || '#e1e1e6',
          shadowOpacity: 0,
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
