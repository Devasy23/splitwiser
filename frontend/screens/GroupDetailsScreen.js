import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, FAB, Paragraph, Title } from 'react-native-paper';
import { getGroupExpenses, getGroupMembers, getOptimizedSettlements } from '../api/groups';
import { AuthContext } from '../context/AuthContext';


// A placeholder background image
const BACKGROUND_IMAGE = { uri: 'https://picsum.photos/id/40/800/1200' };

// ModernCard component for consistent styling
const ModernCard = ({ children }) => (
    <View style={styles.card}>
        {children}
    </View>
);


const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId, groupName, groupIcon } = route.params;
  const { token, user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Currency configuration
  const currency = '₹'; // Default to INR

  // Helper function to format currency amounts
  const formatCurrency = (amount) => `${currency}${amount.toFixed(2)}`;

  const fetchData = async () => {
    try {
      setIsLoading(true);
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
    navigation.setOptions({
        title: groupName,
        headerStyle: {
            backgroundColor: 'transparent',
        },
        headerTintColor: 'white',
        headerTransparent: true,

    });
    if (token && groupId) {
      fetchData();
    }
  }, [token, groupId, navigation, groupName]);

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
    let balanceColor = '#E0E0E0';

    if (net > 0) {
      balanceText = `You are owed ${formatCurrency(net)}`;
      balanceColor = '#A5D6A7';
    } else if (net < 0) {
      balanceText = `You borrowed ${formatCurrency(Math.abs(net))}`;
      balanceColor = '#EF9A9A';
    } else {
      balanceText = "You are settled for this expense.";
    }

    return (
        <ModernCard>
            <Title style={styles.cardTitle}>{item.description}</Title>
            <Paragraph style={styles.cardText}>Amount: {formatCurrency(item.amount)}</Paragraph>
            <Paragraph style={styles.cardText}>Paid by: {getMemberName(item.paidBy || item.createdBy)}</Paragraph>
            <Paragraph style={{ color: balanceColor, fontWeight: 'bold' }}>{balanceText}</Paragraph>
        </ModernCard>
    );
  };

  const renderSettlementSummary = () => {
    const userOwes = settlements.filter(s => s.fromUserId === user._id);
    const userIsOwed = settlements.filter(s => s.toUserId === user._id);
    const totalOwed = userOwes.reduce((sum, s) => sum + s.amount, 0);
    const totalToReceive = userIsOwed.reduce((sum, s) => sum + s.amount, 0);

    if (userOwes.length === 0 && userIsOwed.length === 0) {
      return (
        <View style={styles.settledContainer}>
          <Text style={styles.settledText}>✓ You are all settled up!</Text>
        </View>
      );
    }

    return (
      <View style={styles.settlementContainer}>
        {totalOwed > 0 && (
          <View>
            <Text style={styles.sectionTitle}>You need to pay: <Text style={styles.amountOwed}>{formatCurrency(totalOwed)}</Text></Text>
            {userOwes.map((s, index) => (
              <View key={`owes-${index}`} style={styles.settlementItem}>
                  <Text style={styles.personName}>{getMemberName(s.toUserId)}</Text>
                  <Text style={styles.settlementAmountOwed}>{formatCurrency(s.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {totalToReceive > 0 && (
          <View>
            <Text style={styles.sectionTitle}>You will receive: <Text style={styles.amountReceive}>{formatCurrency(totalToReceive)}</Text></Text>
            {userIsOwed.map((s, index) => (
              <View key={`is-owed-${index}`} style={styles.settlementItem}>
                  <Text style={styles.personName}>{getMemberName(s.fromUserId)}</Text>
                  <Text style={styles.settlementAmountReceive}>{formatCurrency(s.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ImageBackground source={BACKGROUND_IMAGE} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="white"/>
      </ImageBackground>
    );
  }

  const renderHeader = () => (
    <>
      <ModernCard>
          <Title style={styles.cardTitle}>Settlement Summary</Title>
          {renderSettlementSummary()}
      </ModernCard>

      <ModernCard>
          <Title style={styles.cardTitle}>Members</Title>
          {members.map((item) => (
            <Paragraph key={item.userId} style={styles.memberText}>• {item.user.name}</Paragraph>
          ))}
      </ModernCard>

      <Title style={styles.expensesTitle}>Expenses</Title>
    </>
  );

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.container}>
        <FlatList
            style={styles.contentContainer}
            data={expenses}
            renderItem={renderExpense}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View>
                {renderHeader()}
                <Text style={styles.emptyText}>No expenses recorded yet.</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 80 }}
        />

        <FAB
            style={styles.fab}
            icon="plus"
            color='white'
            onPress={() => navigation.navigate('AddExpense', { groupId: groupId })}
        />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
      flex: 1,
      padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
      color: 'white',
      fontWeight: 'bold',
      marginBottom: 8,
  },
  cardText: {
      color: '#E0E0E0',
  },
  expensesTitle: {
      marginTop: 16,
      marginBottom: 8,
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
  },
  memberText: {
      fontSize: 16,
      lineHeight: 24,
      color: 'white',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  settlementContainer: {
    gap: 16,
  },
  settledContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  settledText: {
    fontSize: 16,
    color: '#A5D6A7',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  amountOwed: {
    color: '#EF9A9A',
    fontWeight: 'bold',
  },
  amountReceive: {
    color: '#A5D6A7',
    fontWeight: 'bold',
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  personName: {
    fontSize: 14,
    color: '#E0E0E0',
    flex: 1,
  },
  settlementAmountOwed: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF9A9A',
  },
  settlementAmountReceive: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#A5D6A7',
  },
  emptyText: {
      color: 'white',
      textAlign: 'center',
  }
});

export default GroupDetailsScreen;
