import { useContext, useEffect, useState } from "react";
import { Alert, Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import {
  ActivityIndicator,
  Chip,
  FAB,
  IconButton
} from "react-native-paper";
import {
  getGroupExpenses,
  getGroupMembers,
  getOptimizedSettlements,
} from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { AnimatedCard, FadeInView, ScaleInView, SlideInView } from "../utils/animations";
import { GradientCard, StatusGradient } from "../utils/gradients";
import { borderRadius, colors, shadows, spacing, typography } from "../utils/theme";

const { width } = Dimensions.get('window');

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const { token, user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Currency configuration - can be made configurable later
  const currency = "₹"; // Default to INR, can be changed to '$' for USD

  // Helper function to format currency amounts
  const formatCurrency = (amount) => `${currency}${amount.toFixed(2)}`;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch members, expenses, and settlements in parallel
      const [membersResponse, expensesResponse, settlementsResponse] =
        await Promise.all([
          getGroupMembers(groupId),
          getGroupExpenses(groupId),
          getOptimizedSettlements(groupId),
        ]);
      setMembers(membersResponse.data);
      setExpenses(expensesResponse.data.expenses);
      setSettlements(settlementsResponse.data.optimizedSettlements || []);
    } catch (error) {
      console.error("Failed to fetch group details:", error);
      Alert.alert("Error", "Failed to fetch group details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: groupName,
      headerRight: () => (
        <IconButton
          icon="cog"
          onPress={() => navigation.navigate("GroupSettings", { groupId })}
        />
      ),
    });
    if (token && groupId) {
      fetchData();
    }
  }, [token, groupId]);

  const getMemberName = (userId) => {
    const member = members.find((m) => m.userId === userId);
    return member ? member.user.name : "Unknown";
  };

  const renderExpense = ({ item, index }) => {
    const userSplit = item.splits.find((s) => s.userId === user._id);
    const userShare = userSplit ? userSplit.amount : 0;
    const paidByMe = (item.paidBy || item.createdBy) === user._id;
    const net = paidByMe ? item.amount - userShare : -userShare;

    let balanceText;
    let statusType = 'settled';

    if (net > 0) {
      balanceText = `💰 You're owed ${formatCurrency(net)}`;
      statusType = 'success';
    } else if (net < 0) {
      balanceText = `💳 You borrowed ${formatCurrency(Math.abs(net))}`;
      statusType = 'warning';
    } else {
      balanceText = "✨ You're settled for this expense";
      statusType = 'settled';
    }

    return (
      <SlideInView delay={index * 50} style={styles.expenseWrapper}>
        <AnimatedCard style={styles.expenseCard}>
          <View style={styles.expenseHeader}>
            <View style={styles.expenseMainInfo}>
              <Text style={styles.expenseTitle}>{item.description}</Text>
              <Text style={styles.expenseAmount}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
            <Chip 
              mode="outlined" 
              style={styles.paidByChip}
              textStyle={styles.chipText}
            >
              Paid by {getMemberName(item.paidBy || item.createdBy)}
            </Chip>
          </View>
          
          <StatusGradient 
            status={statusType} 
            style={styles.expenseStatusContainer}
          >
            <Text style={styles.expenseStatusText}>
              {balanceText}
            </Text>
          </StatusGradient>
        </AnimatedCard>
      </SlideInView>
    );
  };

  const renderSettlementSummary = () => {
    const userOwes = settlements.filter((s) => s.fromUserId === user._id);
    const userIsOwed = settlements.filter((s) => s.toUserId === user._id);
    const totalOwed = userOwes.reduce((sum, s) => sum + s.amount, 0);
    const totalToReceive = userIsOwed.reduce((sum, s) => sum + s.amount, 0);

    // If user is all settled up
    if (userOwes.length === 0 && userIsOwed.length === 0) {
      return (
        <StatusGradient status="settled" style={styles.settledContainer}>
          <Text style={styles.settledText}>🎉 You're all settled up!</Text>
          <Text style={styles.settledSubtext}>
            No pending payments in this group
          </Text>
        </StatusGradient>
      );
    }

    return (
      <View style={styles.settlementContainer}>
        {/* You owe section */}
        {totalOwed > 0 && (
          <StatusGradient status="warning" style={styles.owedSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                💳 You need to pay
              </Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(totalOwed)}
              </Text>
            </View>
            {userOwes.map((s, index) => (
              <View key={`owes-${index}`} style={styles.settlementItem}>
                <Text style={styles.personName}>
                  {getMemberName(s.toUserId)}
                </Text>
                <Text style={styles.settlementAmount}>
                  {formatCurrency(s.amount)}
                </Text>
              </View>
            ))}
          </StatusGradient>
        )}

        {/* You receive section */}
        {totalToReceive > 0 && (
          <StatusGradient status="success" style={styles.receiveSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                💰 You'll receive
              </Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(totalToReceive)}
              </Text>
            </View>
            {userIsOwed.map((s, index) => (
              <View key={`is-owed-${index}`} style={styles.settlementItem}>
                <Text style={styles.personName}>
                  {getMemberName(s.fromUserId)}
                </Text>
                <Text style={styles.settlementAmount}>
                  {formatCurrency(s.amount)}
                </Text>
              </View>
            ))}
          </StatusGradient>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <FadeInView style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </FadeInView>
      </View>
    );
  }

  const renderHeader = () => (
    <FadeInView>
      <GradientCard 
        colors={colors.gradientPrimary} 
        style={styles.summaryCard}
      >
        <Text style={styles.summaryTitle}>Settlement Summary</Text>
        {renderSettlementSummary()}
      </GradientCard>

      <View style={styles.expensesSectionHeader}>
        <Text style={styles.expensesTitle}>Recent Expenses</Text>
        <Text style={styles.expensesSubtitle}>
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </FadeInView>
  );

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.contentContainer}
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <FadeInView style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No expenses yet! 💸</Text>
            <Text style={styles.emptyText}>
              Add your first expense to start tracking group spending
            </Text>
          </FadeInView>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <ScaleInView delay={300}>
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate("AddExpense", { groupId: groupId })}
          color="white"
          label="Add Expense"
          extended={true}
        />
      </ScaleInView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    padding: spacing.md,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body1,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  summaryCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  summaryTitle: {
    ...typography.h3,
    color: 'white',
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: '700',
  },
  expensesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  expensesTitle: {
    ...typography.h3,
    color: colors.onSurface,
  },
  expensesSubtitle: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
  },
  expenseWrapper: {
    marginBottom: spacing.md,
  },
  expenseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
  },
  chipText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  expenseStatusContainer: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  expenseStatusText: {
    ...typography.label,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Settlement Summary Styles
  settlementContainer: {
    gap: spacing.md,
  },
  settledContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  settledText: {
    ...typography.h4,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  settledSubtext: {
    ...typography.body2,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  owedSection: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  receiveSection: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: 'white',
    fontWeight: '600',
  },
  totalAmount: {
    ...typography.amount,
    color: 'white',
    fontWeight: '700',
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: spacing.xs,
  },
  personName: {
    ...typography.body1,
    color: 'white',
    flex: 1,
  },
  settlementAmount: {
    ...typography.label,
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body1,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    ...shadows.large,
  },
});

export default GroupDetailsScreen;
