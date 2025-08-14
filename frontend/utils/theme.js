// Modern theme for Splitwiser - Gen Z friendly design
export const colors = {
  // Primary brand colors
  primary: '#6C5CE7',        // Modern purple
  primaryDark: '#5A4FCF',    // Darker purple for pressed states
  primaryLight: '#A29BFE',   // Light purple for backgrounds
  
  // Secondary colors
  secondary: '#00D2FF',      // Electric blue
  secondaryDark: '#00B8E6',  // Darker blue
  secondaryLight: '#74E5FF', // Light blue
  
  // Success/Positive
  success: '#00E676',        // Bright green
  successDark: '#00C853',    // Darker green
  successLight: '#69F0AE',   // Light green
  
  // Warning/Owed money
  warning: '#FF6B35',        // Modern orange
  warningDark: '#E55A2B',    // Darker orange
  warningLight: '#FF8F65',   // Light orange
  
  // Error/Debt
  error: '#FF3B5C',          // Modern red
  errorDark: '#E6354E',      // Darker red
  errorLight: '#FF6B8A',     // Light red
  
  // Neutral colors
  background: '#FAFBFF',     // Off-white with slight blue tint
  surface: '#FFFFFF',        // Pure white
  surfaceVariant: '#F5F7FA', // Light gray
  
  // Text colors
  onSurface: '#1A1D29',      // Dark blue-gray
  onSurfaceVariant: '#6B7280', // Medium gray
  onSurfaceMuted: '#9CA3AF',   // Light gray
  
  // Borders and dividers
  outline: '#E5E7EB',        // Light border
  outlineVariant: '#F3F4F6', // Very light border
  
  // Gradients
  gradientPrimary: ['#6C5CE7', '#A29BFE'],
  gradientSecondary: ['#00D2FF', '#74E5FF'],
  gradientSuccess: ['#00E676', '#69F0AE'],
  gradientWarning: ['#FF6B35', '#FF8F65'],
  gradientError: ['#FF3B5C', '#FF6B8A'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  
  // Body text
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  
  // Small text
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  
  // Labels
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  
  // Numbers and amounts
  amount: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const animations = {
  // Timing configurations
  timing: {
    short: 200,
    medium: 300,
    long: 500,
  },
  
  // Easing functions
  easing: {
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Paper theme configuration for react-native-paper
export const paperTheme = {
  colors: {
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    background: colors.background,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: colors.onSurface,
    onSurfaceVariant: colors.onSurfaceVariant,
    onError: '#FFFFFF',
    outline: colors.outline,
    outlineVariant: colors.outlineVariant,
  },
  roundness: borderRadius.md,
};
