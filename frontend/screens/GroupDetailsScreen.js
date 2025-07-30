import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Button, Text, Card, ActivityIndicator, Appbar, FAB, Title, Paragraph } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { getGroupMembers, getGroupExpenses } from '../api/groups';

const GroupDetailsScreen = ({ route, navigation }) => {
  const { groupId, groupName } = route.params;
  const { token } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch members and expenses in parallel
      const [membersResponse, expensesResponse] = await Promise.all([
        getGroupMembers(token, groupId),
        getGroupExpenses(token, groupId),
      ]);
      setMembers(membersResponse.data);
      setExpenses(expensesResponse.data.expenses);
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

  const renderExpense = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.description}</Title>
        <Paragraph>Amount: ${item.amount.toFixed(2)}</Paragraph>
        {/* The API doesn't provide the payer's name directly in the expense object */}
        {/* We would need to match the createdBy id with the members list */}
        {/* <Paragraph>Paid by: {getMemberName(item.createdBy)}</Paragraph> */}
      </Card.Content>
    </Card>
  );

  const renderMember = ({ item }) => (
      <Paragraph style={styles.memberText}>• {item.user.name}</Paragraph>
  );

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

        <View style={styles.contentContainer}>
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
        </View>

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
