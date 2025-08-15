import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing } from '../../styles/theme';

const Card = ({ children, style, intensity = 100, tint = 'light' }) => {
  // The glassmorphic effect is a combination of a semi-transparent background and a blur.
  // BlurView is not supported on all platforms (e.g., web, older Android), so we provide a fallback.
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <View style={[styles.cardContainer, style]}>
        <BlurView
          style={styles.blurView}
          intensity={intensity}
          tint={tint}
        >
          {children}
        </BlurView>
      </View>
    );
  }

  // Fallback for platforms that don't support BlurView
  return (
    <View style={[styles.cardContainer, styles.fallbackCard, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  blurView: {
    padding: spacing.lg,
    // The background color is set on the BlurView itself for a better effect
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fallbackCard: {
    backgroundColor: colors.neutral.white,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
});

export default Card;
