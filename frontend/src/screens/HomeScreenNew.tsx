import { AuthContext } from '@/context/AuthContext';
import { lightTheme } from '@/styles/theme';
import { elevation, spacing, typography } from '@/styles/variables';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Divider,
    FAB,
    IconButton,
    Surface,
    Text
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Simplified types for the component
interface SimpleGroup {
  _id: string;
  name: string;
  description?: string;
  memberCount: number;
  memberNames: string[];
  balance: number;
}

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [groups, setGroups] = useState<SimpleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useContext(AuthContext);

  // Mock data for demo
  const mockGroups: SimpleGroup[] = [
    {
      _id: '1',
      name: 'Weekend Trip',
      description: 'Beach house rental and activities',
      memberCount: 3,
      memberNames: ['You', 'Alex', 'Sarah'],
      balance: 125.50,
    },
    {
      _id: '2',
      name: 'Roommates',
      description: 'Monthly shared expenses',
      memberCount: 2,
      memberNames: ['You', 'Mike'],
      balance: -67.25,
    },
    {
      _id: '3',
      name: 'Office Lunch',
      description: 'Weekly lunch orders',
      memberCount: 4,
      memberNames: ['You', 'Emma', 'Tom', 'Lisa'],
      balance: 23.75,
    },
  ];

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        setGroups(mockGroups);
        setLoading(false);
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to load groups');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = () => {
    Alert.alert('Coming Soon', 'Create group feature will be available soon.');
  };

  const handleGroupPress = (group: SimpleGroup) => {
    navigation.navigate('GroupDetails', { groupId: group._id, group });
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return lightTheme.colors.primary;
    if (balance < 0) return lightTheme.colors.error;
    return lightTheme.colors.onSurfaceVariant;
  };

  const formatBalance = (balance: number) => {
    const abs = Math.abs(balance);
    if (balance > 0) return `You are owed $${abs.toFixed(2)}`;
    if (balance < 0) return `You owe $${abs.toFixed(2)}`;
    return 'Settled up';
  };

  const renderGroupCard = (group: SimpleGroup) => {
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
              <Text variant="titleLarge" style={styles.groupName}>
                {group.name}
              </Text>
              {group.description && (
                <Text variant="bodyMedium" style={styles.groupDescription}>
                  {group.description}
                </Text>
              )}
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
                {group.memberCount} members
              </Text>
              <View style={styles.memberChips}>
                {group.memberNames.slice(0, 3).map((name, index) => (
                  <Chip
                    key={`${group._id}-${index}`}
                    compact
                    style={styles.memberChip}
                    textStyle={styles.memberChipText}
                  >
                    {name}
                  </Chip>
                ))}
                {group.memberCount > 3 && (
                  <Chip
                    compact
                    style={styles.memberChip}
                    textStyle={styles.memberChipText}
                  >
                    +{group.memberCount - 3}
                  </Chip>
                )}
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.balanceSection}>
              <Text 
                variant="titleMedium" 
                style={[styles.balance, { color: getBalanceColor(group.balance) }]}
              >
                {formatBalance(group.balance)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading your groups...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Surface style={styles.header} elevation={elevation.level1}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Your Groups
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Manage expenses with friends
          </Text>
        </Surface>

        {/* Groups List */}
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
                onPress={handleCreateGroup}
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

        {/* Floating Action Button */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleCreateGroup}
          label="New Group"
        />
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
  header: {
    padding: spacing.lg,
    backgroundColor: lightTheme.colors.surface,
  },
  headerTitle: {
    color: lightTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    color: lightTheme.colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2, // Extra space for FAB
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
  },
  balance: {
    fontWeight: 'bold',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: lightTheme.colors.surface,
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
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
});

export default HomeScreen;
