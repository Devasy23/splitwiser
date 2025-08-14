import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Chip, Text } from 'react-native-paper';
import { AnimatedCard } from './animations';
import { StatusGradient } from './gradients';
import { hapticFeedback } from './haptics';
import { borderRadius, colors, shadows, spacing, typography } from './theme';

// Enhanced Group Card
export const GroupCard = ({
  group,
  onPress,
  settlementStatus,
  memberCount,
  style,
}) => {
  const handlePress = () => {
    hapticFeedback.medium();
    onPress?.();
  };

  const getStatusInfo = () => {
    if (!settlementStatus) {
      return {
        text: "Calculating...",
        type: 'info',
        icon: '⏳'
      };
    }

    if (settlementStatus.isSettled) {
      return {
        text: "✨ All settled up!",
        type: 'settled',
        icon: '✅'
      };
    }

    if (settlementStatus.netBalance > 0) {
      return {
        text: `💰 You're owed ${settlementStatus.netBalance}`,
        type: 'success',
        icon: '💰'
      };
    } else if (settlementStatus.netBalance < 0) {
      return {
        text: `💳 You owe ${Math.abs(settlementStatus.netBalance)}`,
        type: 'warning',
        icon: '💳'
      };
    }

    return {
      text: "✨ All settled up!",
      type: 'settled',
      icon: '✅'
    };
  };

  const statusInfo = getStatusInfo();
  const isImage = group.imageUrl && /^(https?:|data:image)/.test(group.imageUrl);
  const groupIcon = group.imageUrl || group.name?.charAt(0) || "?";

  return (
    <AnimatedCard onPress={handlePress} style={[styles.groupCard, style]}>
      <View style={styles.groupHeader}>
        {isImage ? (
          <Avatar.Image 
            size={64} 
            source={{ uri: group.imageUrl }} 
            style={styles.groupAvatar}
          />
        ) : (
          <Avatar.Text 
            size={64} 
            label={groupIcon} 
            style={[styles.groupAvatar, { backgroundColor: colors.primary }]}
            labelStyle={styles.avatarLabel}
          />
        )}
        
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.groupMeta}>
            <Chip 
              mode="outlined" 
              style={styles.memberChip}
              textStyle={styles.chipText}
              icon="account-group"
            >
              {memberCount || group.members?.length || 0} members
            </Chip>
          </View>
        </View>
      </View>
      
      <StatusGradient 
        status={statusInfo.type} 
        style={styles.statusContainer}
      >
        <Text style={styles.statusText}>
          {statusInfo.text}
        </Text>
      </StatusGradient>
    </AnimatedCard>
  );
};

// Enhanced Expense Card
export const ExpenseCard = ({
  expense,
  userShare,
  paidByName,
  onPress,
  style,
}) => {
  const handlePress = () => {
    hapticFeedback.light();
    onPress?.();
  };

  const getBalanceInfo = () => {
    if (userShare > 0) {
      return {
        text: `💰 You're owed ${userShare}`,
        type: 'success'
      };
    } else if (userShare < 0) {
      return {
        text: `💳 You borrowed ${Math.abs(userShare)}`,
        type: 'warning'
      };
    }
    return {
      text: "✨ You're settled",
      type: 'settled'
    };
  };

  const balanceInfo = getBalanceInfo();

  return (
    <AnimatedCard onPress={handlePress} style={[styles.expenseCard, style]}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseMainInfo}>
          <Text style={styles.expenseTitle}>{expense.description}</Text>
          <Text style={styles.expenseAmount}>{expense.amount}</Text>
        </View>
        
        <Chip 
          mode="outlined" 
          style={styles.paidByChip}
          textStyle={styles.chipText}
          icon="account"
        >
          Paid by {paidByName}
        </Chip>
      </View>
      
      <StatusGradient 
        status={balanceInfo.type} 
        style={styles.expenseStatus}
      >
        <Text style={styles.statusText}>
          {balanceInfo.text}
        </Text>
      </StatusGradient>
    </AnimatedCard>
  );
};

// Member Card
export const MemberCard = ({
  member,
  isCurrentUser,
  isAdmin,
  onRemove,
  style,
}) => {
  const handleRemove = () => {
    hapticFeedback.medium();
    onRemove?.();
  };

  return (
    <View style={[styles.memberCard, style]}>
      <View style={styles.memberInfo}>
        {member.user?.imageUrl ? (
          <Avatar.Image 
            size={48} 
            source={{ uri: member.user.imageUrl }} 
            style={styles.memberAvatar}
          />
        ) : (
          <Avatar.Text 
            size={48} 
            label={(member.user?.name || "?").charAt(0)} 
            style={[styles.memberAvatar, { backgroundColor: colors.secondary }]}
            labelStyle={styles.avatarLabel}
          />
        )}
        
        <View style={styles.memberDetails}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>
              {member.user?.name || 'Unknown'}
            </Text>
            {isCurrentUser && (
              <Chip 
                mode="outlined" 
                style={styles.youChip}
                textStyle={styles.youChipText}
              >
                You
              </Chip>
            )}
          </View>
          
          {member.role === 'admin' && (
            <Chip 
              mode="outlined" 
              style={styles.adminChip}
              textStyle={styles.adminChipText}
              icon="crown"
            >
              Admin
            </Chip>
          )}
        </View>
      </View>
      
      {isAdmin && !isCurrentUser && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Summary Card
export const SummaryCard = ({
  title,
  children,
  gradient = true,
  style,
}) => {
  const CardComponent = gradient ? StatusGradient : View;
  const cardProps = gradient ? { status: 'info' } : {};

  return (
    <CardComponent {...cardProps} style={[styles.summaryCard, style]}>
      <Text style={[styles.summaryTitle, gradient && styles.summaryTitleGradient]}>
        {title}
      </Text>
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  groupAvatar: {
    marginRight: spacing.md,
  },
  avatarLabel: {
    color: 'white',
    fontWeight: '700',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    ...typography.h4,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberChip: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.outline,
  },
  chipText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  statusContainer: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statusText: {
    ...typography.label,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  expenseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  expenseHeader: {
    marginBottom: spacing.md,
  },
  expenseMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  expenseTitle: {
    ...typography.h4,
    color: colors.onSurface,
    flex: 1,
    marginRight: spacing.md,
  },
  expenseAmount: {
    ...typography.amount,
    color: colors.primary,
  },
  paidByChip: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.outline,
    alignSelf: 'flex-start',
  },
  expenseStatus: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    marginRight: spacing.md,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  memberName: {
    ...typography.h4,
    color: colors.onSurface,
    marginRight: spacing.sm,
  },
  youChip: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  youChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  adminChip: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
    alignSelf: 'flex-start',
  },
  adminChipText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  removeButtonText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    ...shadows.medium,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.onSurface,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryTitleGradient: {
    color: 'white',
  },
});
