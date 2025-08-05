import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, TextInput, Appbar, Title, useTheme } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { joinGroup } from '../api/groups';

const JoinGroupScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { token } = useContext(AuthContext);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { onGroupJoined } = route.params;

  const handleJoinGroup = async () => {
    if (!joinCode) {
      Alert.alert('Error', 'Please enter a join code.');
      return;
    }
    setIsJoining(true);
    try {
      await joinGroup(token, joinCode);
      Alert.alert('Success', 'Successfully joined the group.');
      onGroupJoined(); // Call the callback to refresh the groups list
      navigation.goBack();
    } catch (error) {
      console.error('Failed to join group:', error);
      Alert.alert('Error', 'Failed to join group. Please check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
    },
    input: {
      marginBottom: 16,
    },
    button: {
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Join a Group" />
      </Appbar.Header>
      <View style={styles.content}>
        <Title>Enter Group Code</Title>
        <TextInput
          label="Join Code"
          value={joinCode}
          onChangeText={setJoinCode}
          style={styles.input}
          autoCapitalize="characters"
        />
        <Button
          mode="contained"
          onPress={handleJoinGroup}
          loading={isJoining}
          disabled={isJoining}
          style={styles.button}
        >
          Join Group
        </Button>
      </View>
    </View>
  );
};

export default JoinGroupScreen;
