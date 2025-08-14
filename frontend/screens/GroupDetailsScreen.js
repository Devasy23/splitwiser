import { Ionicons } from "@expo/vector-icons";
import { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator, FAB } from "react-native-paper";
import {
  getGroupExpenses,
  getGroupMembers,
  getOptimizedSettlements,
} from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const { token, user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settlementExpanded, setSettlementExpanded] = useState(false);

  const currency = "₹";
  const formatCurrency = (amount) => `${currency}${amount.toFixed(2)}`;

  const fetchData = async () => {
    try {
      setIsLoading(true);
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
        <TouchableOpacity
          onPress={() => navigation.navigate("GroupSettings", { groupId })}
          style={{ marginRight: spacing.md }}
        >
          <Ionicons name="settings-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: colors.primary,
      },
      headerTintColor: colors.white,
      headerTitleStyle: {
        ...typography.h3,
      },
    });
    if (token && groupId) {
      fetchData();
    }
  }, [token, groupId, navigation]);

  const getMemberName = (userId) => {
    const member = members.find((m) => m.userId === userId);
    return member ? member.user.name : "Unknown";
  };

  const renderExpense = ({ item }) => {
    const userSplit = item.splits.find((s) => s.userId === user._id);
    const userShare = userSplit ? userSplit.amount : 0;
    const paidByMe = (item.paidBy || item.createdBy) === user._id;
    const net = paidByMe ? item.amount - userShare : -userShare;

    let balanceText, balanceColor;
    if (net > 0) {
      balanceText = `You get back ${formatCurrency(net)}`;
      balanceColor = colors.success;
    } else if (net < 0) {
      balanceText = `You owe ${formatCurrency(Math.abs(net))}`;
      balanceColor = colors.error;
    } else {
      balanceText = "You are settled for this expense";
      balanceColor = colors.textSecondary;
    }

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseIcon}>
          <Ionicons name="receipt-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.expenseDetails}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expensePaidBy}>
            Paid by {getMemberName(item.paidBy || item.createdBy)}
          </Text>
          <Text style={[styles.expenseBalance, { color: balanceColor }]}>
            {balanceText}
          </Text>
        </View>
        <Text style={styles.expenseAmount}>
          {formatCurrency(item.amount)}
        </Text>
      </View>
    );
  };

  const renderSettlementSummary = () => {
    const userOwes = settlements.filter((s) => s.fromUserId === user._id);
    const userIsOwed = settlements.filter((s) => s.toUserId === user._id);
    const totalOwed = userOwes.reduce((sum, s) => sum + s.amount, 0);
    const totalToReceive = userIsOwed.reduce((sum, s) => sum + s.amount, 0);

    const toggleExpansion = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSettlementExpanded(!settlementExpanded);
    };

    if (userOwes.length === 0 && userIsOwed.length === 0) {
      return (
        <View style={styles.settledContainer}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={styles.settledText}>You are all settled up!</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity onPress={toggleExpansion} style={styles.summaryCard}>
        <View style={styles.summaryTotals}>
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryLabel}>You Owe</Text>
            <Text style={[styles.summaryAmount, { color: colors.error }]}>
              {formatCurrency(totalOwed)}
            </Text>
          </View>
          <View style={styles.summaryTotal}>
            <Text style={styles.summaryLabel}>You Are Owed</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>
              {formatCurrency(totalToReceive)}
            </Text>
          </View>
          <Ionicons
            name={
              settlementExpanded ? "chevron-up-outline" : "chevron-down-outline"
            }
            size={24}
            color={colors.textSecondary}
          />
        </View>
        {settlementExpanded && (
          <View style={styles.settlementDetails}>
            {userOwes.map((s, index) => (
              <View key={`owes-${index}`} style={styles.settlementItem}>
                <Text style={styles.settlementText}>
                  Pay {getMemberName(s.toUserId)}
                </Text>
                <Text style={styles.settlementAmount}>
                  {formatCurrency(s.amount)}
                </Text>
              </View>
            ))}
            {userIsOwed.map((s, index) => (
              <View key={`is-owed-${index}`} style={styles.settlementItem}>
                <Text style={styles.settlementText}>
                  Receive from {getMemberName(s.fromUserId)}
                </Text>
                <Text style={styles.settlementAmount}>
                  {formatCurrency(s.amount)}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.settleUpButton}
              onPress={() =>
                navigation.navigate("SettleUp", {
                  groupId,
                  settlement: settlements[0],
                  members,
                })
              }
            >
              <Text style={styles.settleUpButtonText}>Settle Up</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderHeader = () => (
    <>
      {renderSettlementSummary()}
      <Text style={styles.expensesTitle}>Expenses</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No expenses recorded yet.</Text>
        }
        contentContainerStyle={styles.contentContainer}
      />
      <FAB
        style={[styles.fab, { backgroundColor: colors.accent }]}
        icon="plus"
        color={colors.white}
        onPress={() => navigation.navigate("AddExpense", { groupId })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: 80,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryTotals: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTotal: {
    alignItems: "center",
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryAmount: {
    ...typography.h2,
  },
  settlementDetails: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    paddingTop: spacing.md,
  },
  settlementItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  settlementText: {
    ...typography.body,
    color: colors.text,
  },
  settlementAmount: {
    ...typography.body,
    fontWeight: "bold",
    color: colors.text,
  },
  settledContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    marginBottom: spacing.lg,
  },
  settledText: {
    ...typography.body,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  expensesTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  expenseCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  expenseIcon: {
    marginRight: spacing.md,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    ...typography.body,
    fontWeight: "bold",
    color: colors.text,
  },
  expensePaidBy: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  expenseBalance: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  expenseAmount: {
    ...typography.h3,
    color: colors.text,
  },
  fab: {
    position: "absolute",
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  settleUpButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: spacing.sm,
    alignItems: "center",
    marginTop: spacing.md,
  },
  settleUpButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "bold",
  },
});

export default GroupDetailsScreen;
