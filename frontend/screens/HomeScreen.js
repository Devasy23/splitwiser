import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

import { getGroups, getOptimizedSettlements } from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";
import { formatCurrency } from "../utils/currency";

// Import new v2 components
import Header from "../components/v2/Header";
import Card from "../components/v2/Card";
import Button from "../components/v2/Button";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [activeGroups, setActiveGroups] = useState([]);
  const [settledGroups, setSettledGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [netBalance, setNetBalance] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwes, setTotalOwes] = useState(0);
  const [isSettledExpanded, setIsSettledExpanded] = useState(false);

  const fetchGroupsAndBalance = async () => {
    try {
      setIsLoading(true);
      const response = await getGroups();
      const groupsList = response.data.groups;

      if (user?._id) {
        let totalNet = 0;
        let userOwed = 0;
        let userOwes = 0;
        const active = [];
        const settled = [];

        await Promise.all(
          groupsList.map(async (group) => {
            const settlementResponse = await getOptimizedSettlements(group._id);
            const settlements = settlementResponse.data.optimizedSettlements || [];

            const owedToUser = settlements
              .filter((s) => s.toUserId === user._id)
              .reduce((sum, s) => sum + s.amount, 0);

            const userOwesAmount = settlements
              .filter((s) => s.fromUserId === user._id)
              .reduce((sum, s) => sum + s.amount, 0);

            const balance = owedToUser - userOwesAmount;
            totalNet += balance;
            userOwed += owedToUser;
            userOwes += userOwesAmount;

            const groupWithBalance = { ...group, balance };
            if (balance === 0 && settlements.length > 0) { // Assuming settled if balance is 0 and there has been activity
              settled.push(groupWithBalance);
            } else {
              active.push(groupWithBalance);
            }
          })
        );

        setActiveGroups(active);
        setSettledGroups(settled);
        setNetBalance(totalNet);
        setTotalOwed(userOwed);
        setTotalOwes(userOwes);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      Alert.alert("Error", "Failed to fetch groups.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupsAndBalance();
  }, [user]);

  const toggleSettledGroups = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSettledExpanded(!isSettledExpanded);
  }

  const DashboardSummary = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>Net Balance</Text>
      <Text style={[styles.summaryBalance, { color: netBalance >= 0 ? colors.semanticSuccess : colors.semanticError }]}>
        {formatCurrency(netBalance)}
      </Text>
      <View style={styles.summaryDetails}>
        <Text style={styles.summaryDetailText}>You are owed: <Text style={{fontWeight: 'bold'}}>{formatCurrency(totalOwed)}</Text></Text>
        <Text style={styles.summaryDetailText}>You owe: <Text style={{fontWeight: 'bold'}}>{formatCurrency(totalOwes)}</Text></Text>
      </View>
    </Card>
  );

  const renderGroupCard = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("GroupDetails", { groupId: item._id, groupName: item.name })}>
      <Card style={styles.groupCard}>
        <View style={styles.groupCardContent}>
          <Text style={styles.groupCardTitle}>{item.name}</Text>
          <Text style={[styles.groupCardBalance, { color: item.balance > 0 ? colors.semanticSuccess : (item.balance < 0 ? colors.semanticError : colors.textPrimary) }]}>
            {formatCurrency(item.balance)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderSettledGroup = (item) => (
    <TouchableOpacity key={item._id} onPress={() => navigation.navigate("GroupDetails", { groupId: item._id, groupName: item.name })}>
        <View style={styles.settledGroupRow}>
          <Text style={styles.settledGroupText}>{item.name}</Text>
          <Ionicons name="checkmark-circle" size={24} color={colors.semanticSuccess} />
        </View>
    </TouchableOpacity>
  );

  const SettledGroupsExpander = () => {
    if (settledGroups.length === 0) return null;

    return (
      <View style={styles.expanderContainer}>
        <TouchableOpacity style={styles.expanderHeader} onPress={toggleSettledGroups}>
          <Text style={styles.expanderTitle}>Settled Groups</Text>
          <Ionicons name={isSettledExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        {isSettledExpanded && (
          <View>
            {settledGroups.map(renderSettledGroup)}
          </View>
        )}
      </View>
    )
  };

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        rightAction={{
          icon: <Ionicons name="add" size={32} color={colors.textPrimary} />,
          onPress: () => navigation.navigate('AddGroup'),
        }}
      />
      <FlatList
        data={activeGroups}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <DashboardSummary />
            <Text style={styles.recentActivityHeader}>Active Groups</Text>
          </>
        }
        ListFooterComponent={<SettledGroupsExpander />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchGroupsAndBalance} tintColor={colors.brandAccent}/>}
        ListEmptyComponent={
          !isLoading && activeGroups.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active groups yet. Create one!</Text>
              <Button title="Create Group" onPress={() => navigation.navigate('AddGroup')} style={{marginTop: spacing.md}} />
            </View>
          )
        }
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
  summaryCard: {
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryBalance: {
    ...typography.h1,
    marginVertical: spacing.sm,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryDetailText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  recentActivityHeader: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  groupCard: {
    marginBottom: spacing.md,
  },
  groupCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupCardTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  groupCardBalance: {
    ...typography.bodyBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  expanderContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderRadius: 20,
    padding: spacing.md,
  },
  expanderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expanderTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  settledGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  settledGroupText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});

export default HomeScreen;
