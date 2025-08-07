import { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Appbar, Avatar, Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { createGroup, getGroups, getOptimizedSettlements } from '../api/groups';
import { AuthContext } from '../context/AuthContext';

// A placeholder background image
const BACKGROUND_IMAGE = { uri: 'https://picsum.photos/id/10/800/1200' };

const ModernCard = ({ item, onPress, settlementStatus }) => {
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
            return '#E0E0E0'; // Light grey for settled
        }
        if (settlementStatus.netBalance > 0) {
            return '#A5D6A7'; // Light green for being owed
        } else if (settlementStatus.netBalance < 0) {
            return '#EF9A9A'; // Light red for owing
        }
        return '#E0E0E0'; // Default light grey
    };

    return (
        <TouchableOpacity onPress={onPress}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Avatar.Text size={40} label={item.icon || item.name.charAt(0)} style={styles.avatar} />
                    <Text style={styles.cardTitle}>{item.name}</Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.joinCodeText}>Join Code: {item.joinCode}</Text>
                    <Text style={[styles.settlementStatus, { color: getStatusColor() }]}>
                        {getSettlementStatusText()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};


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
    return (
        <ModernCard
            item={item}
            onPress={() => navigation.navigate('GroupDetails', { groupId: item._id, groupName: item.name, groupIcon: item.icon })}
            settlementStatus={settlementStatus}
        />
    );
  };

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.container}>
      <Portal>
        <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create a New Group</Text>
            <TextInput
                label="Group Name"
                value={newGroupName}
                onChangeText={setNewGroupName}
                style={styles.input}
                theme={{ colors: { text: 'white', primary: 'white', placeholder: 'gray' } }}
            />
            <Button
                mode="contained"
                onPress={handleCreateGroup}
                loading={isCreatingGroup}
                disabled={isCreatingGroup}
                style={styles.createButton}
            >
                Create
            </Button>
        </Modal>
      </Portal>

      <Appbar.Header style={styles.appbar}>
          <Appbar.Content title="Your Groups" titleStyle={styles.appbarTitle} />
          <Appbar.Action icon="plus" color="white" onPress={showModal} />
          <Appbar.Action icon="account-plus" color="white" onPress={() => navigation.navigate('JoinGroup', { onGroupJoined: fetchGroups })} />
      </Appbar.Header>

      {isLoading ? (
          <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="white" />
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbar: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  appbarTitle: {
    color: 'white',
    fontWeight: 'bold',
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
    height: 120,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cardContent: {
    alignItems: 'flex-start',
  },
  joinCodeText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  settlementStatus: {
    fontWeight: 'bold',
    marginTop: 4,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    padding: 20,
    margin: 20,
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  }
});

export default HomeScreen;
