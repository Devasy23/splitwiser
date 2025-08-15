import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { borderRadius, colors } from './theme';

// Gradient background component
export const GradientBackground = ({ 
  children, 
  colors: gradientColors = colors.gradientPrimary, 
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  ...props 
}) => {
  return (
    <LinearGradient
      colors={gradientColors}
      start={start}
      end={end}
      style={[styles.gradientContainer, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};

// Gradient card component
export const GradientCard = ({ 
  children, 
  colors: gradientColors = colors.gradientPrimary, 
  style,
  radius = borderRadius.lg,
  ...props 
}) => {
  return (
    <LinearGradient
      colors={gradientColors}
      style={[
        styles.gradientCard,
        { borderRadius: radius },
        style
      ]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};

// Gradient text background
export const GradientTextBackground = ({ 
  children, 
  colors: gradientColors = colors.gradientPrimary, 
  style,
  ...props 
}) => {
  return (
    <LinearGradient
      colors={gradientColors}
      style={[styles.gradientText, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};

// Status indicator gradients
export const StatusGradient = ({ status, children, style, ...props }) => {
  let gradientColors;
  
  switch (status) {
    case 'success':
    case 'settled':
      gradientColors = colors.gradientSuccess;
      break;
    case 'warning':
    case 'owed':
      gradientColors = colors.gradientWarning;
      break;
    case 'error':
    case 'debt':
      gradientColors = colors.gradientError;
      break;
    case 'info':
    case 'neutral':
      gradientColors = colors.gradientSecondary;
      break;
    default:
      gradientColors = colors.gradientPrimary;
  }

  return (
    <GradientCard
      colors={gradientColors}
      style={style}
      {...props}
    >
      {children}
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  gradientCard: {
    padding: 16,
    borderRadius: borderRadius.lg,
  },
  gradientText: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
});

export default {
  GradientBackground,
  GradientCard,
  GradientTextBackground,
  StatusGradient,
};
