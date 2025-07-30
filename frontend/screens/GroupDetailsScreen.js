import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Button, Text, Card, ActivityIndicator, Appbar, FAB, Title, Paragraph } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { getGroupMembers, getGroupExpenses, getOptimizedSettlements } from '../api/groups';

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const { token, user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const paidByMe = item.createdBy === user._id;
    const net = paidByMe ? item.amount - userShare : -userShare;

    let balanceText;
    let balanceColor = 'black';

    if (net > 0) {
      balanceText = `You are owed $${net.toFixed(2)}`;
      balanceColor = 'green';
    } else if (net < 0) {
      balanceText = `You borrowed $${Math.abs(net).toFixed(2)}`;
      balanceColor = 'red';
    } else {
      balanceText = "You are settled for this expense.";
    }

    return (
        <Card style={styles.card}>
        <Card.Content>
            <Title>{item.description}</Title>
            <Paragraph>Amount: ${item.amount.toFixed(2)}</Paragraph>
            <Paragraph>Paid by: {getMemberName(item.createdBy)}</Paragraph>
            <Paragraph style={{ color: balanceColor }}>{balanceText}</Paragraph>
        </Card.Content>
        </Card>
    );
  };

  const renderMember = ({ item }) => (
      <Paragraph style={styles.memberText}>• {item.user.name}</Paragraph>
  );

  const renderSettlementSummary = () => {
    const userSettlements = settlements.filter(s => s.fromUserId === user._id);
    const totalOwed = userSettlements.reduce((sum, s) => sum + s.amount, 0);

    if (userSettlements.length === 0) {
      return <Paragraph>You are all settled up in this group!</Paragraph>;
    }

    return (
      <>
        <Title>You owe ${totalOwed.toFixed(2)} overall</Title>
        {userSettlements.map((s, index) => (
          <Paragraph key={index}>
            - You owe {getMemberName(s.toUserId)} ${s.amount.toFixed(2)}
          </Paragraph>
        ))}
      </>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <Appbar.Header>
            <Appbar.BackAction onPress={() => navigation.goBack()} />
            <Appbar.Content title={groupName} />
        </Appbar.Header>

        <ScrollView style={styles.contentContainer}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Settlement Summary</Title>
                    {renderSettlementSummary()}
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Title>Members</Title>
                    <FlatList
                        data={members}
                        renderItem={renderMember}
                        keyExtractor={(item) => item.userId}
                    />
                </Card.Content>
            </Card>

            <Title style={styles.expensesTitle}>Expenses</Title>
            <FlatList
                data={expenses}
                renderItem={renderExpense}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={<Text>No expenses recorded yet.</Text>}
                contentContainerStyle={{ paddingBottom: 80 }} // To avoid FAB overlap
            />
        </ScrollView>

        <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => navigation.navigate('AddExpense', { groupId: groupId })}
        />
    </View>
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
    marginBottom: 16,
  },
  expensesTitle: {
      marginTop: 16,
      marginBottom: 8,
      fontSize: 20,
      fontWeight: 'bold',
  },
  memberText: {
      fontSize: 16,
      lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default GroupDetailsScreen;
