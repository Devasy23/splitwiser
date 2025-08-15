import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import {
  getGroupExpenses,
  getGroupMembers,
  getOptimizedSettlements,
} from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";
import { formatCurrency } from "../utils/currency";

// Import new v2 components
import Header from "../components/v2/Header";
import Card from "../components/v2/Card";

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const { user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    fetchData();
  }, [groupId]);

  const getMember = (userId) => {
    return members.find((m) => m.userId === userId)?.user;
  };

  const renderExpense = ({ item }) => {
    const paidBy = getMember(item.paidBy || item.createdBy);
    return (
      <Card style={styles.expenseCard}>
        <View style={styles.expenseContent}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expensePaidBy}>Paid by {paidBy ? paidBy.name : 'Unknown'}</Text>
        </View>
        <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
      </Card>
    );
  };

  const renderSettlement = (settlement) => {
    const fromUser = getMember(settlement.fromUserId);
    const toUser = getMember(settlement.toUserId);

    if (!fromUser || !toUser) return null;

    // Only show settlements where the current user is involved
    if (fromUser._id !== user._id && toUser._id !== user._id) return null;

    const isPaying = fromUser._id === user._id;

    return (
      <TouchableOpacity
        key={`${fromUser._id}-${toUser._id}`}
        onPress={() => navigation.navigate('SettleUp', { fromUser, toUser, amount: settlement.amount })}
        style={styles.settlementItem}
      >
        <Text style={styles.settlementText}>
          {isPaying ? `You pay ${toUser.name}` : `${fromUser.name} pays you`}
        </Text>
        <Text style={[styles.settlementAmount, { color: isPaying ? colors.semanticError : colors.semanticSuccess }]}>
          {formatCurrency(settlement.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHeaderComponent = () => (
    <>
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Settlements</Text>
        {settlements.length > 0 ? (
          settlements.map(renderSettlement)
        ) : (
          <Text style={styles.emptyText}>No settlements needed.</Text>
        )}
      </View>
      <Text style={styles.sectionTitle}>Expenses</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <Header
        title={groupName}
        leftAction={{
          icon: <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />,
          onPress: () => navigation.goBack(),
        }}
        rightAction={{
          icon: <Ionicons name="add" size={32} color={colors.textPrimary} />,
          onPress: () => navigation.navigate("AddExpense", { groupId }),
        }}
      />
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeaderComponent}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchData} tintColor={colors.brandAccent}/>}
        ListEmptyComponent={!isLoading && <Text style={styles.emptyText}>No expenses yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listContent: {
    paddingTop: 100,
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
  },
  summaryContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  settlementText: {
    ...typography.body,
  },
  settlementAmount: {
    ...typography.bodyBold,
  },
  expenseCard: {
    marginBottom: spacing.md,
  },
  expenseContent: {
    flex: 1,
  },
  expenseDescription: {
    ...typography.bodyBold,
  },
  expensePaidBy: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  expenseAmount: {
    ...typography.h4,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default GroupDetailsScreen;
