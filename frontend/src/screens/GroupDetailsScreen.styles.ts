import { borderRadius, elevation, spacing } from '@/styles/variables';
import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      flex: 1,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.md,
    },
    loadingText: {
      color: theme.colors.onSurface,
    },
    headerContainer: {
      gap: spacing.md,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
    },
    membersCard: {
      backgroundColor: theme.colors.surface,
    },
    cardTitle: {
      color: theme.colors.onSurface,
      marginBottom: spacing.sm,
    },
    divider: {
      marginBottom: spacing.md,
      backgroundColor: theme.colors.outline,
    },
    expenseCard: {
      marginBottom: spacing.md,
      backgroundColor: theme.colors.surface,
    },
    expenseContent: {
      gap: spacing.sm,
    },
    expenseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    expenseTitle: {
      flex: 1,
      color: theme.colors.onSurface,
      marginRight: spacing.sm,
    },
    expenseAmount: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    expenseDetails: {
      gap: spacing.xs,
    },
    expenseDetailText: {
      color: theme.colors.onSurfaceVariant,
    },
    balanceText: {
      fontWeight: '500',
    },
    expensesTitle: {
      marginTop: spacing.md,
      marginBottom: spacing.md,
      color: theme.colors.onBackground,
    },
    membersContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    memberChip: {
      marginRight: spacing.xs,
      marginBottom: spacing.xs,
    },
    memberChipText: {
      fontSize: 12,
      color: theme.colors.onPrimary,
    },
    fab: {
      position: 'absolute',
      margin: spacing.md,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primaryContainer,
    },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: 100, // To avoid FAB overlap
    },
    // Settlement Summary Styles
    settlementContainer: {
      gap: spacing.md,
    },
    settledContainer: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: borderRadius.md,
    },
    settledText: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
    owedSection: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.error,
    },
    receiveSection: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    sectionTitle: {
      marginBottom: spacing.sm,
      color: theme.colors.onSurface,
    },
    amountOwed: {
      color: theme.colors.error,
      fontWeight: 'bold',
    },
    amountReceive: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    settlementItem: {
      marginVertical: spacing.xs,
    },
    personInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    personName: {
      flex: 1,
      color: theme.colors.onSurfaceVariant,
    },
    settlementAmount: {
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    // Empty state styles
    emptyContainer: {
      flex: 1,
    },
    emptyState: {
      padding: spacing.xl,
      margin: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      ...elevation.level1,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    emptySubtext: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      opacity: 0.7,
    },
  });
