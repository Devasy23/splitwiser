import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { THEMES, COLORS } from '../../constants/theme';
import { ThemedText } from './ThemedText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ThemedButton = ({ onPress, children, variant = 'primary', style, loading = false, disabled = false }) => {
  const { style: themeStyle, mode } = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(false);

  // Press animation handlers
  const onPressIn = () => {
    scale.value = withSpring(0.95);
    pressed.value = true;
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
    pressed.value = false;
  };

  // Styles based on theme
  const animatedStyle = useAnimatedStyle(() => {
    const isNeo = themeStyle === THEMES.NEOBRUTALISM;

    // Base transform
    let transform = [{ scale: scale.value }];

    if (isNeo && pressed.value) {
        // Neo press effect: move down-right to simulate button press into shadow
        transform.push({ translateX: 2 }, { translateY: 2 });
    }

    return {
        transform
    };
  });

  // Color Logic
  let backgroundColor = COLORS.neo.main;
  let textColor = 'white';
  let borderColor = COLORS.neo.dark;

  if (variant === 'secondary') {
      backgroundColor = COLORS.neo.second;
      textColor = COLORS.neo.dark;
  } else if (variant === 'outline') {
      backgroundColor = 'transparent';
      textColor = mode === 'dark' ? 'white' : COLORS.neo.dark;
  }

  // Container Styles
  const containerStyle = [
      styles.base,
      themeStyle === THEMES.NEOBRUTALISM ? {
          borderRadius: 0,
          borderWidth: 2,
          borderColor: borderColor,
          backgroundColor: backgroundColor,
          shadowColor: borderColor,
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 0, // customized shadow manually
      } : {
          // Glass / Soft
          borderRadius: 16,
          backgroundColor: backgroundColor,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
          borderWidth: 0,
      },
      variant === 'outline' && themeStyle !== THEMES.NEOBRUTALISM && {
          borderWidth: 1,
          borderColor: mode === 'dark' ? 'white' : '#ddd',
          backgroundColor: 'transparent',
          elevation: 0,
      },
      (disabled || loading) && { opacity: 0.6 },
      style
  ];

  // Neo "pressed" state removes shadow
  const neoPressStyle = useAnimatedStyle(() => {
      if (themeStyle !== THEMES.NEOBRUTALISM) return {};
      return {
          shadowOffset: {
              width: pressed.value ? 0 : 4,
              height: pressed.value ? 0 : 4
          },
      };
  });

  return (
    <AnimatedPressable
      onPress={disabled || loading ? null : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[containerStyle, animatedStyle, neoPressStyle]}
    >
      {loading ? (
          <ActivityIndicator color={textColor} />
      ) : (
          <ThemedText variant="title" style={{ color: textColor, fontSize: 16 }}>
            {children}
          </ThemedText>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
});
