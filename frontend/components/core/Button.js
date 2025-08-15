// Core Button Component - Following Blueprint Specifications
// Implements the 8-second rule and haptic feedback for Gen Z engagement

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '../../utils/theme';

const Button = ({
  title,
  variant = 'primary', // primary, secondary, outline, ghost, destructive
  size = 'medium', // small, medium, large
  onPress,
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const handlePress = async () => {
    if (disabled || loading) return;
    
    // Haptic feedback for engagement (Gen Z preference for tactile response)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (onPress) {
      onPress();
    }
  };

  // Size configurations following minimum touch target of 44px
  const sizeConfig = {
    small: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 36,
      fontSize: 14,
      fontWeight: '500',
    },
    medium: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 44, // Accessibility minimum
      fontSize: 16,
      fontWeight: '600',
    },
    large: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      minHeight: 52,
      fontSize: 18,
      fontWeight: '600',
    },
  };

  // Variant configurations for different button types
  const variantConfig = {
    primary: {
      useGradient: true,
      gradientColors: [colors.brand.accent, colors.brand.accentAlt],
      textColor: '#FFFFFF',
      shadowStyle: shadows.small,
    },
    secondary: {
      backgroundColor: colors.background.secondary,
      textColor: colors.text.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      shadowStyle: shadows.subtle,
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: colors.brand.accent,
      borderWidth: 2,
      borderColor: colors.brand.accent,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: colors.brand.accent,
    },
    destructive: {
      backgroundColor: colors.semantic.error,
      textColor: '#FFFFFF',
      shadowStyle: shadows.small,
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  // Base button style
  const buttonStyle = {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: currentSize.minHeight,
    paddingVertical: currentSize.paddingVertical,
    paddingHorizontal: currentSize.paddingHorizontal,
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    ...currentVariant.shadowStyle,
    ...currentVariant,
    ...style,
  };

  // Text style
  const textStyleConfig = {
    fontSize: currentSize.fontSize,
    fontWeight: currentSize.fontWeight,
    color: currentVariant.textColor,
    fontFamily: 'Inter',
    ...textStyle,
  };

  // Loading spinner color
  const spinnerColor = currentVariant.textColor;

  const ButtonContent = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={spinnerColor} 
          style={{ marginRight: spacing.sm }} 
        />
      )}
      {icon && !loading && (
        <View style={{ marginRight: spacing.sm }}>
          {icon}
        </View>
      )}
      <Text style={textStyleConfig}>
        {title}
      </Text>
    </View>
  );

  // Render with gradient if specified
  if (currentVariant.useGradient && !disabled) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[buttonStyle, { backgroundColor: 'transparent' }]}
        {...props}
      >
        <LinearGradient
          colors={currentVariant.gradientColors}
          style={{
            ...buttonStyle,
            shadowColor: 'transparent', // Remove shadow from gradient container
            elevation: 0,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <ButtonContent />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Regular button without gradient
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={buttonStyle}
      {...props}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
};

export default Button;
