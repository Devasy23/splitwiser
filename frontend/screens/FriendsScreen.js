import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Appbar, List, Divider, ActivityIndicator } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { getGroups, getGroupDetails } from '../api/groups';
import { useIsFocused } from '@react-navigation/native';

const FriendsScreen = () => {
    const { token, user } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const isFocused = useIsFocused();

    const calculateFriendBalances = (groupsWithDetails) => {
        const balances = {}; // { friendId: { name, netBalance, groups: { groupId: { name, balance } } } }

        groupsWithDetails.forEach(group => {
            const [membersResponse, expensesResponse] = group.details;
            const members = membersResponse.data;
            const expenses = expensesResponse.data.expenses;

            if (!expenses) return; // Guard against undefined expenses

            expenses.forEach(expense => {
                const payerId = expense.createdBy;
                const payerIsMe = payerId === user._id;

                expense.splits.forEach(split => {
                    const memberId = split.userId;
                    const memberIsMe = memberId === user._id;

                    if (memberId === payerId) return; // Payer doesn't owe themselves

                    if (payerIsMe && !memberIsMe) { // I paid, they owe me
                        if (!balances[memberId]) balances[memberId] = { name: members.find(m => m.userId === memberId)?.user.name || 'Unknown', netBalance: 0, groups: {} };
                        if (!balances[memberId].groups[group.id]) balances[memberId].groups[group.id] = { name: group.name, balance: 0 };
                        balances[memberId].netBalance += split.amount;
                        balances[memberId].groups[group.id].balance += split.amount;
                    } else if (!payerIsMe && memberIsMe) { // They paid, I owe them
                        if (!balances[payerId]) balances[payerId] = { name: members.find(m => m.userId === payerId)?.user.name || 'Unknown', netBalance: 0, groups: {} };
                        if (!balances[payerId].groups[group.id]) balances[payerId].groups[group.id] = { name: group.name, balance: 0 };
                        balances[payerId].netBalance -= split.amount;
                        balances[payerId].groups[group.id].balance -= split.amount;
                    }
                });
            });
        });

        // Format the data for the UI
        const formattedFriends = Object.entries(balances).map(([id, data]) => ({
            id,
            name: data.name,
            netBalance: data.netBalance,
            groups: Object.entries(data.groups).map(([groupId, groupData]) => ({
                id: groupId,
                name: groupData.name,
                balance: groupData.balance,
            })),
        }));

        setFriends(formattedFriends);
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const groupsResponse = await getGroups(token);
                const groups = groupsResponse.data.groups;

                const groupsWithDetails = await Promise.all(
                    groups.map(async (group) => {
                        const details = await getGroupDetails(token, group._id);
                        return { ...group, id: group._id, details };
                    })
                );

                calculateFriendBalances(groupsWithDetails);

            } catch (error) {
                console.error('Failed to fetch data for friends screen:', error);
                Alert.alert('Error', 'Failed to load friends data.');
            } finally {
                setIsLoading(false);
            }
        };

        if (token && isFocused) {
            fetchData();
        }
    }, [token, isFocused]);

    const renderFriend = ({ item }) => {
        const balanceColor = item.netBalance < 0 ? 'red' : 'green';
        const balanceText = item.netBalance < 0
            ? `You owe $${Math.abs(item.netBalance).toFixed(2)}`
            : `Owes you $${item.netBalance.toFixed(2)}`;

        return (
            <List.Accordion
                title={item.name}
                description={item.netBalance !== 0 ? balanceText : 'Settled up'}
                descriptionStyle={{ color: item.netBalance !== 0 ? balanceColor : 'gray' }}
                left={props => <List.Icon {...props} icon="account" />}
            >
                {item.groups.map(group => (
                    <List.Item
                        key={group.id}
                        title={group.name}
                        description={`Balance: $${group.balance.toFixed(2)}`}
                        left={props => <List.Icon {...props} icon="group" />}
                    />
                ))}
            </List.Accordion>
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
        <Appbar.Content title="Friends" />
      </Appbar.Header>
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={<Text style={styles.emptyText}>No balances with friends yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 20,
  }
});

export default FriendsScreen;
