import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import {
    ActivityIndicator,
    Card,
    Chip,
    Divider,
    FAB,
    Surface,
    Text,
    useTheme,
} from 'react-native-paper';

import { getGroupExpenses, getGroupMembers, getOptimizedSettlements } from '@/api/groups';
import { AuthContext } from '@/context/AuthContext';
import { Expense, GroupMember, RouteParams, Settlement } from '@/types';
import { calculateUserBalance, formatCurrency, generateAvatarColor, getBalanceInfo } from '@/utils/helpers';
import { createStyles } from './GroupDetailsScreen.styles';

type Props = NativeStackScreenProps<RouteParams, 'GroupDetails'>;

interface ExpenseItemProps {
  item: Expense;
  members: GroupMember[];
  userId: string;
}

const GroupDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { groupId, groupName, groupIcon } = route.params;
  const { token, user } = useContext(AuthContext);
  const theme = useTheme();
  const styles = createStyles(theme);
  
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Currency configuration - can be made configurable later
  const currency = '₹'; // Default to INR, can be changed to '$' for USD

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch members, expenses, and settlements in parallel
      const [membersResponse, expensesResponse, settlementsResponse] = await Promise.all([
        getGroupMembers(token!, groupId),
        getGroupExpenses(token!, groupId),
        getOptimizedSettlements(token!, groupId),
      ]);
      setMembers(membersResponse.data);
      setExpenses(expensesResponse.data.expenses);
      setSettlements(settlementsResponse.data.optimizedSettlements || []);
    } catch (error) {
      console.error('Failed to fetch group details:', error);
      Alert.alert('Error', 'Failed to fetch group details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: groupName });
    if (token && groupId) {
      fetchData();
    }
  }, [token, groupId, groupName, navigation]);

  const getMemberName = (userId: string): string => {
    const member = members.find(m => m.userId === userId);
    return member ? member.user.name : 'Unknown';
  };

  const ExpenseItem: React.FC<ExpenseItemProps> = ({ item, members, userId }) => {
    const net = calculateUserBalance(item, userId);
    const { text: balanceText, color: balanceColor } = getBalanceInfo(
      net,
      (amount) => formatCurrency(amount, currency)
    );

    return (
      <Card style={styles.expenseCard} mode="elevated">
        <Card.Content style={styles.expenseContent}>
          <View style={styles.expenseHeader}>
            <Text variant="titleMedium" style={styles.expenseTitle}>
              {item.description}
            </Text>
            <Text variant="bodyLarge" style={styles.expenseAmount}>
              {formatCurrency(item.amount, currency)}
            </Text>
          </View>
          
          <View style={styles.expenseDetails}>
            <Text variant="bodyMedium" style={styles.expenseDetailText}>
              Paid by: {getMemberName(item.createdBy)}
            </Text>
            <Text 
              variant="bodyMedium" 
              style={[styles.balanceText, { color: balanceColor }]}
            >
              {balanceText}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSettlementSummary = () => {
    if (!user) return null;

    const userOwes = settlements.filter(s => s.fromUserId === user._id);
    const userIsOwed = settlements.filter(s => s.toUserId === user._id);
    const totalOwed = userOwes.reduce((sum, s) => sum + s.amount, 0);
    const totalToReceive = userIsOwed.reduce((sum, s) => sum + s.amount, 0);

    // If user is all settled up
    if (userOwes.length === 0 && userIsOwed.length === 0) {
      return (
        <Surface style={styles.settledContainer} elevation={0}>
          <Text variant="bodyLarge" style={styles.settledText}>
            ✓ You are all settled up!
          </Text>
        </Surface>
      );
    }

    return (
      <View style={styles.settlementContainer}>
        {/* You owe section - only show if totalOwed > 0 */}
        {totalOwed > 0 && (
          <Surface style={styles.owedSection} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              You need to pay: 
              <Text style={styles.amountOwed}> {formatCurrency(totalOwed, currency)}</Text>
            </Text>
            {userOwes.map((settlement, index) => (
              <View key={`owes-${index}`} style={styles.settlementItem}>
                <View style={styles.personInfo}>
                  <Text variant="bodyMedium" style={styles.personName}>
                    {getMemberName(settlement.toUserId)}
                  </Text>
                  <Text variant="bodyMedium" style={styles.settlementAmount}>
                    {formatCurrency(settlement.amount, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </Surface>
        )}

        {/* You receive section - only show if totalToReceive > 0 */}
        {totalToReceive > 0 && (
          <Surface style={styles.receiveSection} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              You will receive: 
              <Text style={styles.amountReceive}> {formatCurrency(totalToReceive, currency)}</Text>
            </Text>
            {userIsOwed.map((settlement, index) => (
              <View key={`is-owed-${index}`} style={styles.settlementItem}>
                <View style={styles.personInfo}>
                  <Text variant="bodyMedium" style={styles.personName}>
                    {getMemberName(settlement.fromUserId)}
                  </Text>
                  <Text variant="bodyMedium" style={styles.settlementAmount}>
                    {formatCurrency(settlement.amount, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </Surface>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Card style={styles.summaryCard} mode="elevated">
        <Card.Content>
          <Text variant="headlineSmall" style={styles.cardTitle}>
            Settlement Summary
          </Text>
          <Divider style={styles.divider} />
          {renderSettlementSummary()}
        </Card.Content>
      </Card>

      <Card style={styles.membersCard} mode="elevated">
        <Card.Content>
          <Text variant="headlineSmall" style={styles.cardTitle}>
            Members ({members.length})
          </Text>
          <Divider style={styles.divider} />
          <View style={styles.membersContainer}>
            {members.map((member) => (
              <Chip
                key={member.userId}
                avatar={{
                  source: member.user.imageUrl 
                    ? { uri: member.user.imageUrl }
                    : undefined
                }}
                style={[
                  styles.memberChip,
                  { backgroundColor: generateAvatarColor(member.user.name) }
                ]}
                textStyle={styles.memberChipText}
              >
                {member.user.name}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Text variant="headlineSmall" style={styles.expensesTitle}>
        Expenses ({expenses.length})
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" animating={true} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading group details...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.contentContainer}
        data={expenses}
        renderItem={({ item }) => (
          <ExpenseItem 
            item={item} 
            members={members} 
            userId={user?._id || ''} 
          />
        )}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {renderHeader()}
            <Surface style={styles.emptyState} elevation={1}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No expenses recorded yet.
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Add your first expense to get started!
              </Text>
            </Surface>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Expense"
        onPress={() => navigation.navigate('AddExpense', { groupId: groupId })}
        mode="elevated"
      />
    </View>
  );
};

export default GroupDetailsScreen;
