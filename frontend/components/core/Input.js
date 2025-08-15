// Enhanced Input Components - Following Blueprint Specifications
// Implements glassmorphism and tactile feedback for modern UX

import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
    Animated,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import theme, { animations, borderRadius, colors, spacing, typography } from '../../utils/theme';

const EnhancedTextInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  style,
  inputStyle,
  variant = 'standard', // standard, filled, outlined
  autoCapitalize = 'sentences',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handleFocus = async () => {
    setIsFocused(true);
    // Haptic feedback on focus for tactile engagement
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: animations.timing.fast,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: animations.timing.fast,
      useNativeDriver: false,
    }).start();
  };

  const togglePasswordVisibility = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPassword(!showPassword);
  };

  // Animated border color based on focus state
  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border.subtle, colors.brand.accent],
  });

  // Base input container style
  const containerStyle = {
    marginVertical: spacing.sm,
    ...style,
  };

  // Input variant styles
  const getInputContainerStyle = () => {
    const baseStyle = {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: 44, // Accessibility minimum
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.glass.background,
          borderWidth: 1,
          borderColor: colors.glass.border,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: error ? colors.semantic.error : colors.border.subtle,
        };
      default: // standard
        return {
          ...baseStyle,
          backgroundColor: colors.background.secondary,
          borderWidth: 1,
          borderColor: error ? colors.semantic.error : colors.border.subtle,
        };
    }
  };

  // Text input style
  const textInputStyle = {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
    color: colors.text.primary,
    paddingTop: multiline ? spacing.sm : 0,
    textAlignVertical: multiline ? 'top' : 'center',
    ...inputStyle,
  };

  return (
    <View style={containerStyle}>
      {/* Label */}
      {label && (
        <Text style={{
          fontSize: typography.label.fontSize,
          fontWeight: typography.label.fontWeight,
          fontFamily: typography.label.fontFamily,
          color: error ? colors.semantic.error : colors.text.secondary,
          marginBottom: spacing.xs,
        }}>
          {label}
        </Text>
      )}

      {/* Input Container with Animated Border */}
      <Animated.View
        style={[
          getInputContainerStyle(),
          variant === 'outlined' && {
            borderColor: error ? colors.semantic.error : borderColor,
          },
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={{ marginRight: spacing.sm }}>
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={textInputStyle}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          {...props}
        />

        {/* Right Icon or Password Toggle */}
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            onPress={secureTextEntry ? togglePasswordVisibility : undefined}
            style={{ marginLeft: spacing.sm }}
            disabled={!secureTextEntry}
          >
            {secureTextEntry ? (
              <Text style={{
                fontSize: 16,
                color: colors.brand.accent,
                fontWeight: '500',
              }}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Error Message */}
      {error && (
        <Text style={{
          fontSize: typography.caption.fontSize,
          fontFamily: typography.caption.fontFamily,
          color: colors.semantic.error,
          marginTop: spacing.xs,
        }}>
          {error}
        </Text>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <Text style={{
          fontSize: typography.caption.fontSize,
          fontFamily: typography.caption.fontFamily,
          color: colors.text.secondary,
          marginTop: spacing.xs,
        }}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

// Currency Input Component for financial amounts
const CurrencyInput = ({
  label = 'Amount',
  value,
  onChangeText,
  currency = '$',
  placeholder = '0.00',
  error,
  ...props
}) => {
  const formatCurrency = (text) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  };

  const handleChange = (text) => {
    const formatted = formatCurrency(text);
    onChangeText(formatted);
  };

  return (
    <EnhancedTextInput
      label={label}
      value={value}
      onChangeText={handleChange}
      placeholder={placeholder}
      keyboardType="numeric"
      error={error}
      leftIcon={
        <Text style={{
          fontSize: typography.body.fontSize,
          fontFamily: typography.body.fontFamily,
          color: colors.brand.accent,
          fontWeight: '600',
        }}>
          {currency}
        </Text>
      }
      {...props}
    />
  );
};

// Search Input Component
const SearchInput = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  ...props
}) => {
  const handleClear = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <EnhancedTextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      variant="filled"
      leftIcon={
        <Text style={{ fontSize: 16 }}>🔍</Text>
      }
      rightIcon={
        value ? (
          <TouchableOpacity onPress={handleClear}>
            <Text style={{ 
              fontSize: 16, 
              color: colors.text.secondary 
            }}>
              ✕
            </Text>
          </TouchableOpacity>
        ) : null
      }
      {...props}
    />
  );
};

export { CurrencyInput, EnhancedTextInput, SearchInput };
export default EnhancedTextInput;
