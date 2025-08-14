import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { borderRadius, colors, spacing } from './theme';

// Shimmer effect for loading skeletons
const ShimmerEffect = ({ style, children }) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const shimmerStyle = {
    opacity: shimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  return (
    <Animated.View style={[style, shimmerStyle]}>
      {children}
    </Animated.View>
  );
};

// Group card skeleton
export const GroupCardSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeader}>
      <ShimmerEffect style={styles.skeletonAvatar} />
      <View style={styles.skeletonTextContainer}>
        <ShimmerEffect style={styles.skeletonTitle} />
        <ShimmerEffect style={styles.skeletonSubtitle} />
      </View>
    </View>
    <ShimmerEffect style={styles.skeletonStatus} />
  </View>
);

// Expense item skeleton
export const ExpenseItemSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonExpenseHeader}>
      <ShimmerEffect style={styles.skeletonTitle} />
      <ShimmerEffect style={styles.skeletonAmount} />
    </View>
    <ShimmerEffect style={styles.skeletonChip} />
    <ShimmerEffect style={styles.skeletonStatus} />
  </View>
);

// Member item skeleton
export const MemberItemSkeleton = () => (
  <View style={styles.skeletonMember}>
    <ShimmerEffect style={styles.skeletonMemberAvatar} />
    <View style={styles.skeletonTextContainer}>
      <ShimmerEffect style={styles.skeletonMemberName} />
      <ShimmerEffect style={styles.skeletonMemberRole} />
    </View>
  </View>
);

// List of skeletons
export const SkeletonList = ({ count = 3, SkeletonComponent }) => (
  <View>
    {Array.from({ length: count }, (_, index) => (
      <SkeletonComponent key={index} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.md,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 14,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    width: '50%',
  },
  skeletonStatus: {
    height: 32,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  skeletonExpenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  skeletonAmount: {
    height: 20,
    width: 80,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
  },
  skeletonChip: {
    height: 24,
    width: 120,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.round,
    marginBottom: spacing.md,
  },
  skeletonMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skeletonMemberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
    marginRight: spacing.md,
  },
  skeletonMemberName: {
    height: 18,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    width: '60%',
  },
  skeletonMemberRole: {
    height: 14,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    width: '40%',
  },
});
