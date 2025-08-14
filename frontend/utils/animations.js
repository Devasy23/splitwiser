import { useEffect, useRef } from 'react';
import { Animated, TouchableWithoutFeedback, View } from 'react-native';
import { animations, colors } from './theme';

// Animated TouchableCard component with press animation
export const AnimatedCard = ({ children, onPress, style, disabled, ...props }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: animations.timing.short,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: animations.timing.short,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: animations.timing.short,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: animations.timing.short,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
    opacity: opacityValue,
  };

  if (onPress && !disabled) {
    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        {...props}
      >
        <Animated.View style={[style, animatedStyle]}>
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
};

// Slide in animation for list items
export const SlideInView = ({ children, delay = 0, style }) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: animations.timing.medium,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: animations.timing.medium,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, translateY, opacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Fade in animation
export const FadeInView = ({ children, delay = 0, style, duration = animations.timing.medium }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity, duration]);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

// Scale in animation for FAB and buttons
export const ScaleInView = ({ children, delay = 0, style }) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Pulse animation for important elements
export const PulseView = ({ children, style, pulseColor = colors.primary }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: pulse }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
