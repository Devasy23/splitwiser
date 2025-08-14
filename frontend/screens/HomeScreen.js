import { useContext, useEffect, useState } from "react";
import { Alert, Dimensions, FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  FAB,
  Modal,
  Portal,
  Text,
  TextInput
} from "react-native-paper";
import { createGroup, getGroups, getOptimizedSettlements } from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { AnimatedCard, FadeInView, ScaleInView, SlideInView } from "../utils/animations";
import { formatCurrency, getCurrencySymbol } from "../utils/currency";
import { StatusGradient } from "../utils/gradients";
import { borderRadius, colors, shadows, spacing, typography } from "../utils/theme";

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { token, logout, user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupSettlements, setGroupSettlements] = useState({}); // Track settlement status for each group

  // State for the Create Group modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);

  // Calculate settlement status for a group
  const calculateSettlementStatus = async (groupId, userId) => {
    try {
      const response = await getOptimizedSettlements(groupId);
      const settlements = response.data.optimizedSettlements || [];

      // Check if user has any pending settlements
      const userOwes = settlements.filter((s) => s.fromUserId === userId);
      const userIsOwed = settlements.filter((s) => s.toUserId === userId);

      const totalOwed = userOwes.reduce((sum, s) => sum + (s.amount || 0), 0);
      const totalToReceive = userIsOwed.reduce(
        (sum, s) => sum + (s.amount || 0),
        0
      );

      return {
        isSettled: totalOwed === 0 && totalToReceive === 0,
        owesAmount: totalOwed,
        owedAmount: totalToReceive,
        netBalance: totalToReceive - totalOwed,
      };
    } catch (error) {
      console.error(
        "Failed to fetch settlement status for group:",
        groupId,
        error
      );
      return {
        isSettled: true,
        owesAmount: 0,
        owedAmount: 0,
        netBalance: 0,
      };
    }
  };

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await getGroups();
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
      console.error("Failed to fetch groups:", error);
      Alert.alert("Error", "Failed to fetch groups.");
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
      Alert.alert("Error", "Please enter a group name.");
      return;
    }
    setIsCreatingGroup(true);
    try {
      await createGroup(newGroupName);
      hideModal();
      setNewGroupName("");
      await fetchGroups(); // Refresh the groups list
    } catch (error) {
      console.error("Failed to create group:", error);
      Alert.alert("Error", "Failed to create group.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const currencySymbol = getCurrencySymbol();

  const renderGroup = ({ item, index }) => {
    const settlementStatus = groupSettlements[item._id];

    // Generate settlement status text
    const getSettlementStatusText = () => {
      if (!settlementStatus) {
        return "Calculating balances...";
      }

      if (settlementStatus.isSettled) {
        return "✨ All settled up!";
      }

      if (settlementStatus.netBalance > 0) {
        return `💰 You're owed ${formatCurrency(settlementStatus.netBalance)}`;
      } else if (settlementStatus.netBalance < 0) {
        return `💳 You owe ${formatCurrency(Math.abs(settlementStatus.netBalance))}`;
      }

      return "✨ All settled up!";
    };

    // Get status for gradient
    const getStatusType = () => {
      if (!settlementStatus || settlementStatus.isSettled) {
        return 'settled';
      }
      if (settlementStatus.netBalance > 0) {
        return 'success';
      } else if (settlementStatus.netBalance < 0) {
        return 'warning';
      }
      return 'settled';
    };

    const isImage = item.imageUrl && /^(https?:|data:image)/.test(item.imageUrl);
    const groupIcon = item.imageUrl || item.name?.charAt(0) || "?";
    
    return (
      <SlideInView delay={index * 100} style={styles.cardWrapper}>
        <AnimatedCard
          onPress={() =>
            navigation.navigate("GroupDetails", {
              groupId: item._id,
              groupName: item.name,
              groupIcon,
            })
          }
          style={styles.modernCard}
        >
          <View style={styles.cardHeader}>
            {isImage ? (
              <Avatar.Image 
                size={56} 
                source={{ uri: item.imageUrl }} 
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text 
                size={56} 
                label={groupIcon} 
                style={[styles.avatar, { backgroundColor: colors.primary }]}
                labelStyle={{ color: 'white', fontWeight: '700' }}
              />
            )}
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.memberCount}>
                {item.members?.length || 0} members
              </Text>
            </View>
          </View>
          
          <StatusGradient 
            status={getStatusType()} 
            style={styles.statusContainer}
          >
            <Text style={styles.statusText}>
              {getSettlementStatusText()}
            </Text>
          </StatusGradient>
        </AnimatedCard>
      </SlideInView>
    );
  };

  return (
    <View style={styles.container}>
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
        >
          <FadeInView>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <Text style={styles.modalSubtitle}>
              Start splitting expenses with friends! 🎉
            </Text>
            <TextInput
              label="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Weekend Trip, Roommates..."
            />
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={hideModal}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateGroup}
                loading={isCreatingGroup}
                disabled={isCreatingGroup}
                style={styles.createButton}
              >
                Create
              </Button>
            </View>
          </FadeInView>
        </Modal>
      </Portal>

      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="Your Groups" 
          titleStyle={styles.headerTitle}
        />
        <Appbar.Action 
          icon="plus" 
          onPress={showModal}
          iconColor={colors.primary}
        />
        <Appbar.Action
          icon="account-plus"
          onPress={() =>
            navigation.navigate("JoinGroup", { onGroupJoined: fetchGroups })
          }
          iconColor={colors.primary}
        />
      </Appbar.Header>

      {isLoading ? (
        <FadeInView style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your groups...</Text>
        </FadeInView>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <FadeInView style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No groups yet! 🎯</Text>
              <Text style={styles.emptyText}>
                Create your first group to start splitting expenses with friends
              </Text>
              <Button
                mode="contained"
                onPress={showModal}
                style={styles.createFirstGroupButton}
                icon="plus"
              >
                Create Group
              </Button>
            </FadeInView>
          }
          onRefresh={fetchGroups}
          refreshing={isLoading}
        />
      )}

      <ScaleInView delay={500}>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={showModal}
          color="white"
        />
      </ScaleInView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.onSurface,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  loadingText: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  modernCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    marginRight: spacing.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    ...typography.h4,
    color: colors.onSurface,
    marginBottom: 2,
  },
  memberCount: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  statusContainer: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statusText: {
    ...typography.label,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  settlementStatus: {
    fontWeight: "500",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body1,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  createFirstGroupButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.large,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.body1,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.outline,
  },
  createButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    ...shadows.large,
  },
});

export default HomeScreen;
