import { createGroup, getGroups } from '@/api/groups';
import { AuthContext } from '@/context/AuthContext';
import { lightTheme } from '@/styles/theme';
import { elevation, spacing, typography } from '@/styles/variables';
import { Group } from '@/types';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Appbar,
    Avatar,
    Button,
    Card,
    Chip,
    Divider,
    IconButton,
    Modal,
    Portal,
    Surface,
    Text,
    TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Create Group Modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  const { user, token, logout } = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      loadGroups();
    }
  }, [token]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      console.log('Loading groups with token:', token ? 'Token exists' : 'No token');
      if (!token) {
        console.error('No authentication token available');
        Alert.alert('Error', 'You need to log in first.');
        return;
      }
      const response = await getGroups(token);
      console.log('Groups response:', response.data);
      setGroups(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch groups:', error);
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Your session has expired. Please log in again.');
        logout(); // This should redirect to login screen
      } else {
        Alert.alert('Error', 'Failed to load groups. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    
    setIsCreatingGroup(true);
    try {
      await createGroup(token, newGroupName.trim());
      setCreateModalVisible(false);
      setNewGroupName('');
      await loadGroups(); // Refresh the groups list
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleJoinGroup = () => {
    navigation.navigate('JoinGroup', { onGroupJoined: loadGroups });
  };

  const handleGroupPress = (group: Group) => {
    navigation.navigate('GroupDetails', { 
      groupId: group._id, 
      groupName: group.name, 
      groupIcon: group.icon 
    });
  };

  const renderGroupCard = (group: Group) => {
    return (
      <Card 
        key={group._id} 
        style={styles.groupCard} 
        mode="elevated"
        onPress={() => handleGroupPress(group)}
      >
        <Card.Content>
          <View style={styles.groupHeader}>
            <View style={styles.groupInfo}>
              <View style={styles.groupTitleRow}>
                <Avatar.Text 
                  size={40} 
                  label={group.icon || group.name.charAt(0).toUpperCase()} 
                  style={styles.groupAvatar}
                />
                <View style={styles.groupTitleText}>
                  <Text variant="titleLarge" style={styles.groupName}>
                    {group.name}
                  </Text>
                  {group.description && (
                    <Text variant="bodyMedium" style={styles.groupDescription}>
                      {group.description}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <IconButton
              icon="chevron-right"
              size={24}
              iconColor={lightTheme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.groupDetails}>
            <View style={styles.membersSection}>
              <Text variant="bodySmall" style={styles.membersLabel}>
                {group.members?.length || 0} members
              </Text>
              <View style={styles.memberChips}>
                {group.members?.slice(0, 3).map((member, index) => (
                  <Chip
                    key={`${group._id}-${index}`}
                    compact
                    style={styles.memberChip}
                    textStyle={styles.memberChipText}
                  >
                    {member.user?.name || 'Unknown'}
                  </Chip>
                ))}
                {(group.members?.length || 0) > 3 && (
                  <Chip
                    compact
                    style={styles.memberChip}
                    textStyle={styles.memberChipText}
                  >
                    +{(group.members?.length || 0) - 3}
                  </Chip>
                )}
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.balanceSection}>
              <Text variant="bodyMedium" style={styles.balanceText}>
                You are settled up
              </Text>
              <Text variant="bodySmall" style={styles.joinCodeText}>
                Join Code: {group.joinCode || 'N/A'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Create Group Modal */}
      <Portal>
        <Modal 
          visible={createModalVisible} 
          onDismiss={() => setCreateModalVisible(false)} 
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Create a New Group
          </Text>
          <TextInput
            label="Group Name"
            value={newGroupName}
            onChangeText={setNewGroupName}
            style={styles.modalInput}
            mode="outlined"
          />
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setCreateModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateGroup}
              loading={isCreatingGroup}
              disabled={isCreatingGroup}
              style={styles.modalButton}
            >
              Create
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Header */}
      <Appbar.Header>
        <Appbar.Content title="Your Groups" />
        <Appbar.Action icon="logout" onPress={logout} />
      </Appbar.Header>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={lightTheme.colors.primary} />
            <Text variant="bodyLarge" style={styles.loadingText}>
              Loading your groups...
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {groups.length === 0 ? (
              <Surface style={styles.emptyState} elevation={elevation.level1}>
                <Text variant="headlineSmall" style={styles.emptyTitle}>
                  No groups yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptyDescription}>
                  Create your first group to start splitting expenses with friends!
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setCreateModalVisible(true)}
                  style={styles.createFirstGroupButton}
                  contentStyle={styles.buttonContent}
                >
                  Create Your First Group
                </Button>
              </Surface>
            ) : (
              <>
                {groups.map(renderGroupCard)}
                <View style={styles.bottomSpacing} />
              </>
            )}
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={() => setCreateModalVisible(true)} 
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
          >
            Create Group
          </Button>
          <Button 
            mode="outlined" 
            onPress={handleJoinGroup} 
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
          >
            Join Group
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: lightTheme.colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl, // Space for action buttons
  },
  groupCard: {
    marginBottom: spacing.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  groupAvatar: {
    backgroundColor: lightTheme.colors.primaryContainer,
  },
  groupTitleText: {
    flex: 1,
  },
  groupName: {
    color: lightTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  groupDescription: {
    color: lightTheme.colors.onSurfaceVariant,
  },
  groupDetails: {
    gap: spacing.md,
  },
  membersSection: {
    gap: spacing.sm,
  },
  membersLabel: {
    color: lightTheme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  memberChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  memberChip: {
    backgroundColor: lightTheme.colors.primaryContainer,
  },
  memberChipText: {
    color: lightTheme.colors.onPrimaryContainer,
    fontSize: typography.labelSmall.fontSize,
  },
  divider: {
    backgroundColor: lightTheme.colors.outline,
  },
  balanceSection: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceText: {
    color: lightTheme.colors.onSurface,
    fontWeight: '500',
  },
  joinCodeText: {
    color: lightTheme.colors.onSurfaceVariant,
    fontSize: typography.bodySmall.fontSize,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: lightTheme.colors.surface,
    borderRadius: spacing.lg,
  },
  emptyTitle: {
    color: lightTheme.colors.onSurface,
    textAlign: 'center',
  },
  emptyDescription: {
    color: lightTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  createFirstGroupButton: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  actionButtons: {
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.outline,
    backgroundColor: lightTheme.colors.surface,
  },
  actionButton: {
    borderRadius: spacing.md,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
  modalContainer: {
    backgroundColor: lightTheme.colors.surface,
    padding: spacing.xl,
    margin: spacing.lg,
    borderRadius: spacing.lg,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: lightTheme.colors.onSurface,
  },
  modalInput: {
    marginBottom: spacing.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});

export default HomeScreen;
