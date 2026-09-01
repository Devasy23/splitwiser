import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * A reusable Skeleton loading component for React Native.
 * Provides a pulsing opacity animation to indicate loading state.
 */
const Skeleton = ({
  width,
  height,
  borderRadius = 4,
  style,
  ...props
}) => {
  const theme = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnim.start();

    return () => pulseAnim.stop();
  }, [opacityAnim]);

  const skeletonColor = theme.colors.surfaceVariant || '#E0E0E0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: skeletonColor,
          opacity: opacityAnim,
        },
        style,
      ]}
      {...props}
    />
  );
};

export default Skeleton;
