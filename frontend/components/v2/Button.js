import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, spacing, typography } from '../../styles/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Button = ({
  title,
  onPress,
  mode = 'primary', // 'primary', 'secondary', 'tertiary'
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const getButtonStyles = () => {
    switch (mode) {
      case 'secondary':
        return styles.secondaryButton;
      case 'tertiary':
        return styles.tertiaryButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyles = () => {
    switch (mode) {
      case 'secondary':
        return styles.secondaryText;
      case 'tertiary':
        return styles.tertiaryText;
      default:
        return styles.primaryText;
    }
  };

  const buttonStyle = [
    styles.button,
    getButtonStyles(),
    disabled && styles.disabled,
    style,
  ];

  const content = loading ? (
    <ActivityIndicator color={mode === 'primary' ? colors.neutral.white : colors.brandAccent} />
  ) : (
    <Text style={[styles.text, getTextStyles(), textStyle]}>{title}</Text>
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[buttonStyle, animatedStyle]}
      {...props}
    >
      {content}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    ...typography.bodyBold,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.brandAccent,
  },
  primaryText: {
    color: colors.neutral.white,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.brandAccent,
  },
  secondaryText: {
    color: colors.brandAccent,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  tertiaryText: {
    color: colors.brandAccent,
  },
  disabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
    borderColor: 'transparent',
  },
});

export default Button;
