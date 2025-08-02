import { useIsFocused } from '@react-navigation/native';
import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Divider, List, Text } from 'react-native-paper';
import { getGroupDetails, getGroups } from '../api/groups';
import { AuthContext } from '../context/AuthContext';
import { calculateFriendBalances } from '../utils/balanceCalculator';

const FriendsScreen = () => {
    const { token, user } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const isFocused = useIsFocused();

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

                // Use the utility function to calculate friend balances
                const calculatedFriends = calculateFriendBalances(groupsWithDetails, user._id);
                setFriends(calculatedFriends);

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
