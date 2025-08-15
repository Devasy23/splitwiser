// Modern Home Screen - Following Blueprint Specifications
// Implements dashboard with financial overview, glassmorphism, and Gen Z UX

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Modal,
  Portal,
  Text,
} from "react-native-paper";
import { createGroup, getGroups, getOptimizedSettlements } from "../api/groups";
import { AuthContext } from "../context/AuthContext";

// Import modern components
import Button from '../components/core/Button';
import { EnhancedTextInput } from '../components/core/Input';
import { FloatingActionButton, ModernHeader } from '../components/navigation/ModernNavigation';
import { GlassCard, GroupSummaryCard, QuickActionCard } from '../utils/cards';
import { borderRadius, colors, spacing, typography } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { token, logout, user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [groupSettlements, setGroupSettlements] = useState({});

  // Create Group modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const balanceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animations
    Animated.stagger(100, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Only fetch groups if user is authenticated
    if (user && token) {
      fetchGroups();
    } else {
      setIsLoading(false); // Stop loading if not authenticated
    }
  }, [user, token]); // Add dependencies

  // Calculate settlement status for a group
  const calculateSettlementStatus = async (groupId, userId) => {
    try {
      const response = await getOptimizedSettlements(groupId);
      const settlements = response.data.optimizedSettlements || [];

      const userOwes = settlements.filter((s) => s.fromUserId === userId);
      const userIsOwed = settlements.filter((s) => s.toUserId === userId);

      const totalOwed = userOwes.reduce((sum, s) => sum + (s.amount || 0), 0);
      const totalToReceive = userIsOwed.reduce((sum, s) => sum + (s.amount || 0), 0);

      const netBalance = totalToReceive - totalOwed;
      const isSettled = settlements.length === 0;

      return {
        isSettled,
        netBalance,
        totalOwed,
        totalToReceive,
        settlements,
      };
    } catch (error) {
      console.error("Error calculating settlements:", error);
      return {
        isSettled: false,
        netBalance: 0,
        totalOwed: 0,
        totalToReceive: 0,
        settlements: [],
      };
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await getGroups(); // Remove token parameter
      console.log('Groups API Response:', response); // Debug log
      
      // Handle different response structures
      let groupsData = response.data;
      if (!groupsData) {
        groupsData = response; // Sometimes the response itself is the data
      }
      if (!Array.isArray(groupsData)) {
        console.warn('Groups data is not an array:', groupsData);
        groupsData = []; // Fallback to empty array
      }
      
      setGroups(groupsData);

      // Calculate settlement status for each group
      if (groupsData.length > 0) {
        const settlementPromises = groupsData.map(async (group) => {
          const status = await calculateSettlementStatus(group._id, user._id);
          return { groupId: group._id, status };
        });

        const settlementsData = await Promise.all(settlementPromises);
        const settlementsMap = {};
        settlementsData.forEach(({ groupId, status }) => {
          settlementsMap[groupId] = status;
        });
        setGroupSettlements(settlementsMap);
      } else {
        // No groups, clear settlements
        setGroupSettlements({});
      }

      // Animate balance numbers
      Animated.timing(balanceAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start();

    } catch (error) {
      console.error("Failed to fetch groups:", error);
      Alert.alert("Error", "Failed to fetch groups. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchGroups();
  };

  const showModal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setNewGroupName("");
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Please enter a group name.");
      return;
    }

    setIsCreatingGroup(true);
    try {
      await createGroup(newGroupName.trim()); // Remove token parameter
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      hideModal();
      fetchGroups();
    } catch (error) {
      console.error("Failed to create group:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const calculateOverallBalance = () => {
    let totalOwed = 0;
    let totalToReceive = 0;
    
    Object.values(groupSettlements).forEach(settlement => {
      totalOwed += settlement.totalOwed || 0;
      totalToReceive += settlement.totalToReceive || 0;
    });

    return {
      net: totalToReceive - totalOwed,
      totalOwed,
      totalToReceive,
      totalGroups: groups.length,
    };
  };

  const overallBalance = calculateOverallBalance();

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <QuickActionCard
          title="Create Group"
          subtitle="Start splitting expenses"
          icon={<Text style={styles.actionIcon}>👥</Text>}
          onPress={showModal}
          variant="accent"
          style={styles.quickActionCard}
        />
        <QuickActionCard
          title="Join Group"
          subtitle="Enter group code"
          icon={<Text style={styles.actionIcon}>🔗</Text>}
          onPress={() => navigation.navigate('JoinGroup')}
          variant="success"
          style={styles.quickActionCard}
        />
        <QuickActionCard
          title="Add Friends"
          subtitle="Expand your network"
          icon={<Text style={styles.actionIcon}>👋</Text>}
          onPress={() => navigation.navigate('Friends')}
          variant="warning"
          style={styles.quickActionCard}
        />
        <QuickActionCard
          title="My Profile"
          subtitle="Account settings"
          icon={<Text style={styles.actionIcon}>⚙️</Text>}
          onPress={() => navigation.navigate('Account')}
          variant="accent"
          style={styles.quickActionCard}
        />
      </View>
    </View>
  );

  const renderGroup = ({ item: group, index }) => {
    const settlement = groupSettlements[group._id];
    if (!settlement) return null;

    return (
      <Animated.View
        style={[
          styles.groupItemContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, index * 10],
                }),
              },
            ],
          },
        ]}
      >
        <GroupSummaryCard
          groupName={group.name}
          totalExpenses={settlement.totalOwed + settlement.totalToReceive}
          yourBalance={settlement.netBalance}
          memberCount={group.memberCount || 2}
          onPress={() => navigation.navigate('GroupDetails', { 
            groupId: group._id, 
            groupName: group.name 
          })}
          style={styles.groupCard}
        />
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[colors.brand.accent, colors.brand.accentAlt]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your groups...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <ModernHeader
        title="Splitwiser"
        subtitle={`Welcome back, ${user?.name || 'User'}!`}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('Account')}
            style={styles.profileButton}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        }
        variant="gradient"
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.brand.accent]}
            tintColor={colors.brand.accent}
          />
        }
      >
        {/* Balance Overview Card */}
        <Animated.View style={[
          styles.balanceContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
          <GlassCard variant="glass" style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>Your Balance</Text>
            
            <Animated.View style={styles.balanceAmountContainer}>
              <Text style={[
                styles.balanceAmount,
                { color: overallBalance.net >= 0 ? colors.semantic.success : colors.semantic.error }
              ]}>
                {overallBalance.net >= 0 ? '+' : ''}${Math.abs(overallBalance.net).toFixed(2)}
              </Text>
              <Text style={styles.balanceLabel}>
                {overallBalance.net >= 0 ? 'You are owed' : 'You owe'}
              </Text>
            </Animated.View>

            <View style={styles.balanceBreakdown}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemAmount}>
                  +${overallBalance.totalToReceive.toFixed(2)}
                </Text>
                <Text style={styles.balanceItemLabel}>To receive</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemAmount}>
                  -${overallBalance.totalOwed.toFixed(2)}
                </Text>
                <Text style={styles.balanceItemLabel}>To pay</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[
          { opacity: fadeAnim },
        ]}>
          {renderQuickActions()}
        </Animated.View>

        {/* Groups Section */}
        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>Your Groups ({groups.length})</Text>
          
          {groups.length === 0 ? (
            <GlassCard variant="outlined" style={styles.emptyStateCard}>
              <Text style={styles.emptyStateIcon}>👥</Text>
              <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first group to start splitting expenses with friends!
              </Text>
              <Button
                title="Create Group"
                onPress={showModal}
                variant="primary"
                style={styles.emptyStateButton}
              />
            </GlassCard>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(item) => item._id}
              renderItem={renderGroup}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.groupsList}
            />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="➕"
        onPress={showModal}
        position="bottom-right"
      />

      {/* Create Group Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
        >
          <GlassCard variant="elevated" style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <Text style={styles.modalSubtitle}>
              Start splitting expenses with your friends
            </Text>

            <EnhancedTextInput
              label="Group Name"
              placeholder="Trip to Vegas, Roommates, etc."
              value={newGroupName}
              onChangeText={setNewGroupName}
              variant="filled"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={hideModal}
                variant="ghost"
                style={styles.modalActionButton}
              />
              <Button
                title={isCreatingGroup ? "Creating..." : "Create Group"}
                onPress={handleCreateGroup}
                variant="primary"
                loading={isCreatingGroup}
                disabled={isCreatingGroup}
                style={styles.modalActionButton}
              />
            </View>
          </GlassCard>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: '#FFFFFF',
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
  },
  profileButton: {
    padding: spacing.xs,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    ...typography.label,
    color: '#FFFFFF',
  },
  balanceContainer: {
    margin: spacing.lg,
  },
  balanceCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  balanceTitle: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  balanceAmountContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  balanceAmount: {
    ...typography.display,
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceItemAmount: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4,
  },
  balanceItemLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
  },
  quickActionsContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    width: (width - spacing.lg * 3) / 2,
  },
  actionIcon: {
    fontSize: 24,
  },
  groupsSection: {
    padding: spacing.lg,
  },
  emptyStateCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    minWidth: 160,
  },
  groupsList: {
    gap: spacing.md,
  },
  groupItemContainer: {
    marginBottom: spacing.sm,
  },
  groupCard: {
    marginBottom: 0,
  },
  modalContainer: {
    margin: spacing.lg,
    justifyContent: 'center',
  },
  modalCard: {
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalInput: {
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalActionButton: {
    flex: 1,
  },
});

export default HomeScreen;
