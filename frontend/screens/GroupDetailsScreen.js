import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Card, FAB, Paragraph, Title, useTheme } from 'react-native-paper';
import { getGroupExpenses, getGroupMembers, getOptimizedSettlements } from '../api/groups';
import { AuthContext } from '../context/AuthContext';

const GroupDetailsScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { groupId, groupName, groupIcon } = route.params;
  const { token, user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Currency configuration - can be made configurable later
  const currency = '₹'; // Default to INR, can be changed to '$' for USD

  // Helper function to format currency amounts
  const formatCurrency = (amount) => `${currency}${amount.toFixed(2)}`;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch members, expenses, and settlements in parallel
      const [membersResponse, expensesResponse, settlementsResponse] = await Promise.all([
        getGroupMembers(token, groupId),
        getGroupExpenses(token, groupId),
        getOptimizedSettlements(token, groupId),
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
  }, [token, groupId]);

  const getMemberName = (userId) => {
    const member = members.find(m => m.userId === userId);
    return member ? member.user.name : 'Unknown';
  };

  const renderExpense = ({ item }) => {
    const userSplit = item.splits.find(s => s.userId === user._id);
    const userShare = userSplit ? userSplit.amount : 0;
    const paidByMe = (item.paidBy || item.createdBy) === user._id;
    const net = paidByMe ? item.amount - userShare : -userShare;

    let balanceText;
    let balanceColor = theme.colors.onSurface;

    if (net > 0) {
      balanceText = `You are owed ${formatCurrency(net)}`;
      balanceColor = theme.colors.primary;
    } else if (net < 0) {
      balanceText = `You borrowed ${formatCurrency(Math.abs(net))}`;
      balanceColor = theme.colors.error;
    } else {
      balanceText = "You are settled for this expense.";
    }

    return (
        <Card style={styles.card}>
        <Card.Content>
            <Title>{item.description}</Title>
            <Paragraph>Amount: {formatCurrency(item.amount)}</Paragraph>
            <Paragraph>Paid by: {getMemberName(item.paidBy || item.createdBy)}</Paragraph>
            <Paragraph style={{ color: balanceColor }}>{balanceText}</Paragraph>
        </Card.Content>
        </Card>
    );
  };

  const renderSettlementSummary = () => {
    const userOwes = settlements.filter(s => s.fromUserId === user._id);
    const userIsOwed = settlements.filter(s => s.toUserId === user._id);
    const totalOwed = userOwes.reduce((sum, s) => sum + s.amount, 0);
    const totalToReceive = userIsOwed.reduce((sum, s) => sum + s.amount, 0);

    // If user is all settled up
    if (userOwes.length === 0 && userIsOwed.length === 0) {
      return (
        <View style={styles.settledContainer}>
          <Text style={styles.settledText}>✓ You are all settled up!</Text>
        </View>
      );
    }

    return (
      <View style={styles.settlementContainer}>
        {/* You owe section - only show if totalOwed > 0 */}
        {totalOwed > 0 && (
          <View style={styles.owedSection}>
            <Text style={styles.sectionTitle}>You need to pay: <Text style={styles.amountOwed}>{formatCurrency(totalOwed)}</Text></Text>
            {userOwes.map((s, index) => (
              <View key={`owes-${index}`} style={styles.settlementItem}>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{getMemberName(s.toUserId)}</Text>
                  <Text style={styles.settlementAmount}>{formatCurrency(s.amount)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* You receive section - only show if totalToReceive > 0 */}
        {totalToReceive > 0 && (
          <View style={styles.receiveSection}>
            <Text style={styles.sectionTitle}>You will receive: <Text style={styles.amountReceive}>{formatCurrency(totalToReceive)}</Text></Text>
            {userIsOwed.map((s, index) => (
              <View key={`is-owed-${index}`} style={styles.settlementItem}>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{getMemberName(s.fromUserId)}</Text>
                  <Text style={styles.settlementAmount}>{formatCurrency(s.amount)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    card: {
      marginBottom: 16,
    },
    expensesTitle: {
        marginTop: 16,
        marginBottom: 8,
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
    memberText: {
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.onSurfaceVariant,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    // Settlement Summary Styles
    settlementContainer: {
      gap: 16,
    },
    settledContainer: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    settledText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    owedSection: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.error,
    },
    receiveSection: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
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
      marginVertical: 4,
    },
    personInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    personName: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    settlementAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderHeader = () => (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Settlement Summary</Title>
          {renderSettlementSummary()}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Members</Title>
          {members.map((item) => (
            <Paragraph key={item.userId} style={styles.memberText}>• {item.user.name}</Paragraph>
          ))}
        </Card.Content>
      </Card>

      <Title style={styles.expensesTitle}>Expenses</Title>
    </>
  );

  return (
    <View style={styles.container}>
        <FlatList
            style={styles.contentContainer}
            data={expenses}
            renderItem={renderExpense}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View>
                {renderHeader()}
                <Text>No expenses recorded yet.</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 80 }} // To avoid FAB overlap
        />

        <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => navigation.navigate('AddExpense', { groupId: groupId })}
        />
    </View>
  );
};

export default GroupDetailsScreen;
