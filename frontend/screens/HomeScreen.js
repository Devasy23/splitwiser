import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Button, Text, Card, ActivityIndicator, Appbar, Modal, Portal, TextInput } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { getGroups, createGroup } from '../api/groups';

const HomeScreen = ({ navigation }) => {
  const { token, logout } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for the Create Group modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await getGroups(token);
      setGroups(response.data.groups);
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

  const renderGroup = ({ item }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('GroupDetails', { groupId: item._id, groupName: item.name })}>
      <Card.Title title={item.name} />
      <Card.Content>
        <Text>Join Code: {item.joinCode}</Text>
        <Text>You are settled up.</Text>
      </Card.Content>
    </Card>
  );

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
          <Appbar.Action icon="logout" onPress={logout} />
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

      <View style={styles.actions}>
          <Button mode="contained" onPress={showModal} style={styles.button}>
            Create Group
          </Button>
          <Button mode="outlined" onPress={() => navigation.navigate('JoinGroup', { onGroupJoined: fetchGroups })} style={styles.button}>
            Join Group
          </Button>
      </View>
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
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    marginTop: 8,
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
