import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { colors } from "../styles/theme";

const SkeletonLoader = ({ style }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [colors.secondary, colors.white]
    );
    return {
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.skeleton, animatedStyle, style]} />;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.secondary,
    borderRadius: 4,
  },
});

export default SkeletonLoader;
