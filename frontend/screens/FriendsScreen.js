import { useIsFocused } from '@react-navigation/native';
import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Divider, IconButton, List, Text } from 'react-native-paper';
import { getFriendsBalance } from '../api/groups';
import { AuthContext } from '../context/AuthContext';

const FriendsScreen = () => {
    const { token, user } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTooltip, setShowTooltip] = useState(true);
    const isFocused = useIsFocused();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const friendsResponse = await getFriendsBalance(token);
                const friendsData = friendsResponse.data.friendsBalance || [];
                
                // Transform the backend data to match the expected frontend format
                const transformedFriends = friendsData.map(friend => ({
                    id: friend.userId,
                    name: friend.userName,
                    netBalance: friend.netBalance,
                    groups: friend.breakdown.map(group => ({
                        id: group.groupId,
                        name: group.groupName,
                        balance: group.balance
                    }))
                }));
                
                setFriends(transformedFriends);

            } catch (error) {
                console.error('Failed to fetch friends balance data:', error);
                Alert.alert('Error', 'Failed to load friends balance data.');
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
                {item.groups.map(group => {
                    const groupBalanceColor = group.balance < 0 ? 'red' : 'green';
                    const groupBalanceText = group.balance < 0 
                        ? `You owe $${Math.abs(group.balance).toFixed(2)}` 
                        : `Owes you $${group.balance.toFixed(2)}`;
                    
                    return (
                        <List.Item
                            key={group.id}
                            title={group.name}
                            description={groupBalanceText}
                            descriptionStyle={{ color: groupBalanceColor }}
                            left={props => <List.Icon {...props} icon="group" />}
                        />
                    );
                })}
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
      {showTooltip && (
        <View style={styles.explanationContainer}>
          <View style={styles.explanationContent}>
            <Text style={styles.explanationText}>
              💡 These amounts show your direct balance with each friend across all shared groups. 
              Check individual group details for optimized settlement suggestions.
            </Text>
            <IconButton
              icon="close"
              size={16}
              onPress={() => setShowTooltip(false)}
              style={styles.closeButton}
            />
          </View>
        </View>
      )}
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
  explanationContainer: {
      backgroundColor: '#f0f8ff',
      margin: 8,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#2196f3',
  },
  explanationContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
  },
  explanationText: {
      fontSize: 12,
      color: '#555',
      lineHeight: 16,
      flex: 1,
      paddingRight: 8,
  },
  closeButton: {
      margin: 0,
      marginTop: -4,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 20,
  }
});

export default FriendsScreen;
