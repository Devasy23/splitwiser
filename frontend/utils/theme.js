// Design System for Splitwiser - Following the Blueprint for Gen Z-Centric Fintech Experience
// Based on "Expressive Minimalism" philosophy with Strategic Glassmorphism

export const colors = {
  // Primary Palette (Fintech Trust) - Deep, stable colors for security and professionalism
  background: {
    primary: '#111827', // Deep blue-gray for dark mode
    primaryLight: '#FFFFFF', // Pure white for light mode
    secondary: '#1F2937', // Secondary background for cards, modals (dark)
    secondaryLight: '#F3F4F6', // Secondary background (light)
  },
  
  // Text colors with high contrast for accessibility
  text: {
    primary: '#F9FAFB', // Primary text for dark mode
    primaryLight: '#111827', // Primary text for light mode
    secondary: '#9CA3AF', // Secondary text for dark mode
    secondaryLight: '#6B7280', // Secondary text for light mode
  },
  
  // Accent Palette (Gen Z Expression) - Bold, high-energy colors
  brand: {
    accent: '#8B5CF6', // Vibrant purple - primary accent
    accentAlt: '#06B6D4', // Electric blue/aqua alternative
    accentMagenta: '#D946EF', // Viva magenta for bold expressions
  },
  
  // Semantic Palette - Standardized system status colors
  semantic: {
    success: '#10B981', // Clear, accessible green
    warning: '#F59E0B', // Amber for warnings
    error: '#EF4444', // Distinct red for errors/destructive actions
  },
  
  // Border and divider colors
  border: {
    subtle: '#374151', // Subtle borders for dark mode
    subtleLight: '#E5E7EB', // Subtle borders for light mode
  },
  
  // Glassmorphism-specific colors
  glass: {
    background: 'rgba(255, 255, 255, 0.1)', // Semi-transparent background
    backgroundLight: 'rgba(0, 0, 0, 0.05)', // For light mode
    border: 'rgba(255, 255, 255, 0.2)', // Subtle border for glass effect
    borderLight: 'rgba(0, 0, 0, 0.1)', // For light mode
  },
};

// CSS Custom Properties (Design Tokens) as specified in the blueprint
export const tokens = {
  // Color tokens
  '--color-background-primary': colors.background.primary,
  '--color-background-secondary': colors.background.secondary,
  '--color-text-primary': colors.text.primary,
  '--color-text-secondary': colors.text.secondary,
  '--color-brand-accent': colors.brand.accent,
  '--color-semantic-success': colors.semantic.success,
  '--color-semantic-error': colors.semantic.error,
  '--color-border-subtle': colors.border.subtle,
  
  // Typography tokens
  '--font-family-primary': "'Inter', sans-serif",
  '--font-size-display': '48px',
  '--font-size-h1': '32px',
  '--font-size-h2': '24px',
  '--font-size-body': '16px',
  '--font-size-caption': '12px',
  '--font-weight-regular': '400',
  '--font-weight-medium': '500',
  '--font-weight-semibold': '600',
  '--font-weight-bold': '700',
  
  // Spacing tokens (8px base unit system)
  '--spacing-xs': '4px',
  '--spacing-sm': '8px',
  '--spacing-md': '16px',
  '--spacing-lg': '24px',
  '--spacing-xl': '32px',
  
  // Sizing tokens
  '--border-radius-sm': '4px',
  '--border-radius-md': '8px',
  '--border-radius-lg': '16px',
  '--touch-target-min': '44px',
};

export const spacing = {
  xs: 4,   // --spacing-xs
  sm: 8,   // --spacing-sm
  md: 16,  // --spacing-md
  lg: 24,  // --spacing-lg
  xl: 32,  // --spacing-xl
  xxl: 48, // Extended spacing for larger gaps
};

export const borderRadius = {
  sm: 4,   // --border-radius-sm: For small elements like tags
  md: 8,   // --border-radius-md: For buttons and input fields
  lg: 16,  // --border-radius-lg: For cards and modals
  round: 999, // For circular elements
};

// Typography system based on Inter font with clear hierarchy
export const typography = {
  // Display text for large, impactful numbers (dashboard balance)
  display: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    fontFamily: 'Inter',
  },
  
  // Headings
  h1: {
    fontSize: 32,  // Screen titles
    fontWeight: '700',
    lineHeight: 40,
    fontFamily: 'Inter',
  },
  h2: {
    fontSize: 24,  // Section headings
    fontWeight: '600',
    lineHeight: 32,
    fontFamily: 'Inter',
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    fontFamily: 'Inter',
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  
  // Body text
  body: {
    fontSize: 16,  // Main body text, labels
    fontWeight: '400',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  
  // Small text
  caption: {
    fontSize: 12,  // Small helper text, metadata
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  
  // Labels and UI text
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
};

// Shadows for depth and elevation
export const shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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

// Animation timings and easing for consistent motion
export const animations = {
  timing: {
    fast: 150,     // Button interactions, quick feedback
    normal: 250,   // Screen transitions, modal appearances
    slow: 300,     // Complex transitions
    loading: 1500, // Success celebrations
  },
  
  easing: {
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design standard
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Glassmorphism effect properties for strategic application
export const glassmorphism = {
  // Background blur and transparency settings
  blur: {
    light: 10,   // Subtle blur for secondary elements
    medium: 20,  // Standard blur for cards
    heavy: 40,   // Strong blur for overlays
  },
  
  // Opacity levels for different contexts
  opacity: {
    subtle: 0.1,   // Very light transparency
    light: 0.2,    // Light transparency for backgrounds
    medium: 0.3,   // Standard transparency for cards
    heavy: 0.4,    // Stronger transparency for emphasis
  },
};

// Paper theme configuration for react-native-paper with blueprint specifications
export const paperTheme = {
  colors: {
    primary: colors.brand.accent,
    primaryContainer: `${colors.brand.accent}20`, // 20% opacity
    secondary: colors.brand.accentAlt,
    secondaryContainer: `${colors.brand.accentAlt}20`,
    surface: colors.background.secondary,
    surfaceVariant: colors.background.secondary,
    background: colors.background.primary,
    error: colors.semantic.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: colors.text.primary,
    onSurfaceVariant: colors.text.secondary,
    onError: '#FFFFFF',
    outline: colors.border.subtle,
    outlineVariant: `${colors.border.subtle}80`, // 50% opacity
  },
  roundness: borderRadius.md,
};

// Default export for convenient theme access
export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animations,
  glassmorphism,
  paperTheme,
  tokens,
};

export default theme;
