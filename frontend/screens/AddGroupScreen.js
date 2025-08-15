import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { createGroup } from '../api/groups';
import { colors, spacing } from '../styles/theme';

// Import new v2 components
import Header from '../components/v2/Header';
import Input from '../components/v2/Input';
import Button from '../components/v2/Button';

const AddGroupScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    setIsLoading(true);
    try {
      await createGroup(groupName);
      navigation.goBack(); // Go back to the previous screen (HomeScreen)
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Create New Group"
        leftAction={{
          icon: <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />,
          onPress: () => navigation.goBack(),
        }}
      />
      <View style={styles.content}>
        <Input
          label="Group Name"
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name..."
        />
        <Button
          title="Create Group"
          onPress={handleCreateGroup}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    paddingTop: 120, // To account for the absolute header
    paddingHorizontal: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
});

export default AddGroupScreen;
