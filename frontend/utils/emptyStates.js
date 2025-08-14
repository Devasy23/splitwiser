import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { FadeInView } from './animations';
import { borderRadius, colors, spacing, typography } from './theme';

// Empty state component for different scenarios
export const EmptyState = ({ 
  icon, 
  title, 
  subtitle, 
  actionText, 
  onAction, 
  illustration 
}) => (
  <FadeInView style={styles.emptyContainer}>
    {illustration && (
      <View style={styles.illustrationContainer}>
        {illustration}
      </View>
    )}
    
    {icon && (
      <Text style={styles.emptyIcon}>{icon}</Text>
    )}
    
    <Text style={styles.emptyTitle}>{title}</Text>
    
    {subtitle && (
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    )}
    
    {actionText && onAction && (
      <Button
        mode="contained"
        onPress={onAction}
        style={styles.emptyAction}
        contentStyle={styles.emptyActionContent}
      >
        {actionText}
      </Button>
    )}
  </FadeInView>
);

// Specific empty states for different screens
export const EmptyGroups = ({ onCreateGroup }) => (
  <EmptyState
    icon="🎯"
    title="No groups yet!"
    subtitle="Create your first group to start splitting expenses with friends and family"
    actionText="Create Your First Group"
    onAction={onCreateGroup}
  />
);

export const EmptyExpenses = ({ onAddExpense, groupName }) => (
  <EmptyState
    icon="💸"
    title="No expenses yet!"
    subtitle={`Start tracking expenses in ${groupName || 'this group'} by adding your first expense`}
    actionText="Add First Expense"
    onAction={onAddExpense}
  />
);

export const EmptyFriends = ({ onAddFriend }) => (
  <EmptyState
    icon="👥"
    title="No friends added yet!"
    subtitle="Add friends to start splitting expenses and tracking balances together"
    actionText="Add Friends"
    onAction={onAddFriend}
  />
);

export const EmptySearch = ({ searchTerm }) => (
  <EmptyState
    icon="🔍"
    title="No results found"
    subtitle={`We couldn't find anything matching "${searchTerm}". Try adjusting your search.`}
  />
);

export const AllSettled = () => (
  <FadeInView style={styles.settledContainer}>
    <Text style={styles.settledIcon}>✨</Text>
    <Text style={styles.settledTitle}>All settled up!</Text>
    <Text style={styles.settledSubtitle}>
      Great job! Everyone in this group is even.
    </Text>
  </FadeInView>
);

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  illustrationContainer: {
    marginBottom: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body1,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  emptyAction: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  emptyActionContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  settledContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
  },
  settledIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  settledTitle: {
    ...typography.h3,
    color: colors.successDark,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  settledSubtitle: {
    ...typography.body1,
    color: colors.successDark,
    textAlign: 'center',
  },
});
