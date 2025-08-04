import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Avatar, Button, Card, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { createGroup, getGroups, getOptimizedSettlements } from '../api/groups';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { token, logout, user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupSettlements, setGroupSettlements] = useState({}); // Track settlement status for each group

  // State for the Create Group modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);

  // Calculate settlement status for a group
  const calculateSettlementStatus = async (groupId, userId) => {
    try {
      const response = await getOptimizedSettlements(token, groupId);
      const settlements = response.data.optimizedSettlements || [];
      
      // Check if user has any pending settlements
      const userOwes = settlements.filter(s => s.fromUserId === userId);
      const userIsOwed = settlements.filter(s => s.toUserId === userId);
      
      const totalOwed = userOwes.reduce((sum, s) => sum + (s.amount || 0), 0);
      const totalToReceive = userIsOwed.reduce((sum, s) => sum + (s.amount || 0), 0);
      
      return {
        isSettled: totalOwed === 0 && totalToReceive === 0,
        owesAmount: totalOwed,
        owedAmount: totalToReceive,
        netBalance: totalToReceive - totalOwed
      };
    } catch (error) {
      console.error('Failed to fetch settlement status for group:', groupId, error);
      return {
        isSettled: true,
        owesAmount: 0,
        owedAmount: 0,
        netBalance: 0
      };
    }
  };

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await getGroups(token);
      const groupsList = response.data.groups;
      setGroups(groupsList);
      
      // Fetch settlement status for each group
      if (user?._id) {
        const settlementPromises = groupsList.map(async (group) => {
          const status = await calculateSettlementStatus(group._id, user._id);
          return { groupId: group._id, status };
        });
        
        const settlementResults = await Promise.all(settlementPromises);
        const settlementMap = {};
        settlementResults.forEach(({ groupId, status }) => {
          settlementMap[groupId] = status;
        });
        setGroupSettlements(settlementMap);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      Alert.alert('Error', 'Failed to fetch groups.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchGroups();
    }
  }, [token]);

  const handleCreateGroup = async () => {
    if (!newGroupName) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    setIsCreatingGroup(true);
    try {
      await createGroup(token, newGroupName);
      hideModal();
      setNewGroupName('');
      await fetchGroups(); // Refresh the groups list
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const renderGroup = ({ item }) => {
    const settlementStatus = groupSettlements[item._id];
    
    // Generate settlement status text
    const getSettlementStatusText = () => {
      if (!settlementStatus) {
        return "Calculating balances...";
      }
      
      if (settlementStatus.isSettled) {
        return "✓ You are settled up.";
      }
      
      if (settlementStatus.netBalance > 0) {
        return `You are owed $${settlementStatus.netBalance.toFixed(2)}.`;
      } else if (settlementStatus.netBalance < 0) {
        return `You owe $${Math.abs(settlementStatus.netBalance).toFixed(2)}.`;
      }
      
      return "You are settled up.";
    };
    
    // Get text color based on settlement status
    const getStatusColor = () => {
      if (!settlementStatus || settlementStatus.isSettled) {
        return '#4CAF50'; // Green for settled
      }
      
      if (settlementStatus.netBalance > 0) {
        return '#4CAF50'; // Green for being owed money
      } else if (settlementStatus.netBalance < 0) {
        return '#F44336'; // Red for owing money
      }
      
      return '#4CAF50'; // Default green
    };

    return (
      <Card style={styles.card} onPress={() => navigation.navigate('GroupDetails', { groupId: item._id, groupName: item.name, groupIcon: item.icon })}>
        <Card.Title
          title={item.name}
          left={(props) => <Avatar.Text {...props} label={item.icon || item.name.charAt(0)} />}
        />
        <Card.Content>
          <Text>Join Code: {item.joinCode}</Text>
          <Text style={[styles.settlementStatus, { color: getStatusColor() }]}>
            {getSettlementStatusText()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Portal>
        <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create a New Group</Text>
          <TextInput
            label="Group Name"
            value={newGroupName}
            onChangeText={setNewGroupName}
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleCreateGroup}
            loading={isCreatingGroup}
            disabled={isCreatingGroup}
          >
            Create
          </Button>
        </Modal>
      </Portal>

      <Appbar.Header>
          <Appbar.Content title="Your Groups" />
          <Appbar.Action icon="plus" onPress={showModal} />
          <Appbar.Action icon="account-plus" onPress={() => navigation.navigate('JoinGroup', { onGroupJoined: fetchGroups })} />
      </Appbar.Header>

      {isLoading ? (
          <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" />
          </View>
      ) : (
          <FlatList
              data={groups}
              renderItem={renderGroup}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={styles.emptyText}>No groups found. Create or join one!</Text>}
              onRefresh={fetchGroups}
              refreshing={isLoading}
          />
      )}
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
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  settlementStatus: {
    fontWeight: '500',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
  }
});

export default HomeScreen;
