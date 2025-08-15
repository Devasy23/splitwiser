// Advanced Card Components - Following Blueprint Specifications
// Implements strategic glassmorphism and micro-animations for Gen Z engagement

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography
} from './theme';

const { width: screenWidth } = Dimensions.get('window');

// Base Card Component with Glassmorphism
const GlassCard = ({
  children,
  variant = 'standard', // standard, elevated, outlined, glass
  onPress,
  style,
  glassEffect = false,
  ...props
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = async () => {
    if (onPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  // Variant configurations
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.background.secondary,
          ...shadows.medium,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border.subtle,
        };
      case 'glass':
        return {
          backgroundColor: colors.glass.background,
          borderWidth: 1,
          borderColor: colors.glass.border,
          // Note: Blur effect would need additional native module
        };
      default: // standard
        return {
          backgroundColor: colors.background.secondary,
          ...shadows.small,
        };
    }
  };

  const cardStyle = {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...getVariantStyle(),
    ...style,
  };

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={cardStyle}
          {...props}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

// Expense Card Component for financial data display
const ExpenseCard = ({
  title,
  amount,
  date,
  paidBy,
  category,
  participants,
  userShare,
  isPaidByUser = false,
  status = 'pending', // pending, settled, owes
  onPress,
  style,
}) => {
  // Status configuration
  const statusConfig = {
    pending: {
      color: colors.brand.accent,
      backgroundColor: `${colors.brand.accent}15`,
      label: 'Pending',
    },
    settled: {
      color: colors.semantic.success,
      backgroundColor: `${colors.semantic.success}15`,
      label: 'Settled',
    },
    owes: {
      color: colors.semantic.warning,
      backgroundColor: `${colors.semantic.warning}15`,
      label: 'You owe',
    },
  };

  const currentStatus = statusConfig[status];

  // Calculate user's net position
  const netAmount = userShare !== undefined 
    ? (isPaidByUser ? amount - userShare : -userShare)
    : 0;
  const isOwed = netAmount > 0;
  const owesAmount = netAmount < 0;

  const formatCurrency = (amount) => `₹${Math.abs(amount).toFixed(2)}`;
  const formatDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const expenseDate = new Date(date);
    const diffTime = Math.abs(now - expenseDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return expenseDate.toLocaleDateString();
  };

  return (
    <GlassCard onPress={onPress} variant="elevated" style={style}>
      {/* Header with title and amount */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
      }}>
        <Text style={{
          ...typography.h4,
          color: colors.text.primary,
          flex: 1,
          marginRight: spacing.sm,
        }}>
          {title}
        </Text>
        
        <Text style={{
          ...typography.display,
          fontSize: 20,
          color: colors.brand.accent,
          fontWeight: '700',
        }}>
          ₹{amount.toFixed(2)}
        </Text>
      </View>

      {/* User's position */}
      {netAmount !== 0 && (
        <View style={{
          backgroundColor: isOwed 
            ? `${colors.semantic.success}15` 
            : `${colors.semantic.warning}15`,
          padding: spacing.sm,
          borderRadius: borderRadius.sm,
          marginBottom: spacing.sm,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: isOwed ? colors.semantic.success : colors.semantic.warning,
            fontFamily: 'Inter',
          }}>
            {isOwed 
              ? `💰 You're owed ${formatCurrency(netAmount)}`
              : `💳 You owe ${formatCurrency(netAmount)}`
            }
          </Text>
        </View>
      )}

      {/* Details */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            ...typography.caption,
            color: colors.text.secondary,
            marginBottom: 2,
          }}>
            Paid by {paidBy} • {formatDate(date)}
          </Text>
          {category && (
            <Text style={{
              ...typography.caption,
              color: colors.text.secondary,
            }}>
              {category}
            </Text>
          )}
        </View>
        
        {participants && participants.length > 0 && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{
              ...typography.caption,
              color: colors.text.secondary,
              marginRight: spacing.xs,
            }}>
              {participants.length} people
            </Text>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.brand.accent,
            }} />
          </View>
        )}
        
        {/* Status badge */}
        <View style={{
          backgroundColor: currentStatus.backgroundColor,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.sm,
          marginLeft: spacing.sm,
        }}>
          <Text style={{
            fontSize: typography.caption.fontSize,
            fontWeight: '600',
            color: currentStatus.color,
            fontFamily: 'Inter',
          }}>
            {currentStatus.label}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

// Group Summary Card with gradient background
const GroupSummaryCard = ({
  groupName,
  totalExpenses,
  yourBalance,
  memberCount,
  onPress,
  style,
}) => {
  const isPositive = yourBalance >= 0;
  const balanceColor = isPositive ? colors.semantic.success : colors.semantic.error;
  const balanceLabel = isPositive ? 'You are owed' : 'You owe';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={[colors.brand.accent, colors.brand.accentAlt]}
        style={{
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          ...shadows.medium,
          ...style,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Group Name */}
        <Text style={{
          ...typography.h3,
          color: '#FFFFFF',
          marginBottom: spacing.sm,
        }}>
          {groupName}
        </Text>

        {/* Stats Row */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: spacing.lg,
        }}>
          <View>
            <Text style={{
              ...typography.caption,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 2,
            }}>
              Total expenses
            </Text>
            <Text style={{
              ...typography.h2,
              color: '#FFFFFF',
            }}>
              ${totalExpenses}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{
              ...typography.caption,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 2,
            }}>
              {memberCount} members
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              {[...Array(Math.min(memberCount, 4))].map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    marginLeft: i > 0 ? 4 : 0,
                  }}
                />
              ))}
              {memberCount > 4 && (
                <Text style={{
                  ...typography.caption,
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginLeft: spacing.xs,
                }}>
                  +{memberCount - 4}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Balance Section */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: borderRadius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }}>
          <Text style={{
            ...typography.caption,
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 2,
          }}>
            {balanceLabel}
          </Text>
          <Text style={{
            ...typography.h2,
            color: '#FFFFFF',
          }}>
            ${Math.abs(yourBalance).toFixed(2)}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Quick Action Card for common actions
const QuickActionCard = ({
  title,
  subtitle,
  icon,
  onPress,
  variant = 'accent', // accent, success, warning
  style,
}) => {
  const variantConfig = {
    accent: {
      backgroundColor: `${colors.brand.accent}10`,
      borderColor: `${colors.brand.accent}30`,
      iconColor: colors.brand.accent,
    },
    success: {
      backgroundColor: `${colors.semantic.success}10`,
      borderColor: `${colors.semantic.success}30`,
      iconColor: colors.semantic.success,
    },
    warning: {
      backgroundColor: `${colors.semantic.warning}10`,
      borderColor: `${colors.semantic.warning}30`,
      iconColor: colors.semantic.warning,
    },
  };

  const config = variantConfig[variant];

  return (
    <GlassCard
      onPress={onPress}
      style={{
        backgroundColor: config.backgroundColor,
        borderWidth: 1,
        borderColor: config.borderColor,
        alignItems: 'center',
        padding: spacing.lg,
        minHeight: 120,
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Icon */}
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${config.iconColor}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
      }}>
        {icon}
      </View>

      {/* Title */}
      <Text style={{
        ...typography.label,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
      }}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={{
          ...typography.caption,
          color: colors.text.secondary,
          textAlign: 'center',
        }}>
          {subtitle}
        </Text>
      )}
    </GlassCard>
  );
};

// Legacy Group Card for backward compatibility
const GroupCard = ({
  group,
  onPress,
  settlementStatus,
  memberCount,
  style,
}) => {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      text: "All good! 👍",
      type: 'info',
      icon: '👍'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <GlassCard onPress={handlePress} variant="elevated" style={style}>
      <Text style={{
        ...typography.h3,
        color: colors.text.primary,
        marginBottom: spacing.sm,
      }}>
        {group.name}
      </Text>

      <Text style={{
        ...typography.body,
        color: colors.text.secondary,
        marginBottom: spacing.md,
      }}>
        {memberCount} members
      </Text>

      <Text style={{
        ...typography.label,
        color: statusInfo.type === 'success' ? colors.semantic.success :
              statusInfo.type === 'warning' ? colors.semantic.warning :
              statusInfo.type === 'settled' ? colors.semantic.success :
              colors.text.secondary,
      }}>
        {statusInfo.text}
      </Text>
    </GlassCard>
  );
};

export {
  ExpenseCard, GlassCard, GroupCard // For backward compatibility
  ,
  GroupSummaryCard,
  QuickActionCard
};

