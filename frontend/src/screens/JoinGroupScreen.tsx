import { joinGroup } from '@/api/groups';
import { AuthContext } from '@/context/AuthContext';
import { lightTheme } from '@/styles/theme';
import { spacing, typography } from '@/styles/variables';
import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Appbar, Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const JoinGroupScreen: React.FC<{ navigation: any; route: { params: { onGroupJoined: () => void } } }> = ({ navigation, route }) => {
  const { token } = useContext(AuthContext);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { onGroupJoined } = route.params;

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code.');
      return;
    }
    
    setIsJoining(true);
    try {
      await joinGroup(token, joinCode.trim().toUpperCase());
      Alert.alert('Success', 'Successfully joined the group!');
      onGroupJoined(); // Call the callback to refresh the groups list
      navigation.goBack();
    } catch (error) {
      console.error('Failed to join group:', error);
      Alert.alert('Error', 'Failed to join group. Please check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Join a Group" />
        </Appbar.Header>
      </View>
      
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Enter Group Code
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Ask your friend for the group join code to get started.
        </Text>
        
        <TextInput
          label="Join Code"
          value={joinCode}
          onChangeText={setJoinCode}
          style={styles.input}
          mode="outlined"
          autoCapitalize="characters"
          placeholder="Enter 6-digit code"
          maxLength={6}
        />
        
        <Button
          mode="contained"
          onPress={handleJoinGroup}
          loading={isJoining}
          disabled={isJoining || !joinCode.trim()}
          style={styles.joinButton}
          contentStyle={styles.buttonContent}
        >
          Join Group
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  header: {
    backgroundColor: lightTheme.colors.surface,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.headlineSmall.fontSize,
    fontWeight: typography.headlineSmall.fontWeight,
    color: lightTheme.colors.onBackground,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: typography.bodyMedium.fontSize,
    color: lightTheme.colors.onSurfaceVariant,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  input: {
    marginBottom: spacing.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  joinButton: {
    marginTop: spacing.md,
    backgroundColor: lightTheme.colors.primary,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});

export default JoinGroupScreen;
