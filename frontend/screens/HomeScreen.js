import { Ionicons } from "@expo/vector-icons";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { createGroup, getGroups, getOptimizedSettlements } from "../api/groups";
import SkeletonLoader from "../components/SkeletonLoader";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";
import { formatCurrency } from "../utils/currency";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HomeScreen = ({ navigation }) => {
  const { token, user } = useContext(AuthContext);
  const [activeGroups, setActiveGroups] = useState([]);
  const [settledGroups, setSettledGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettledExpanded, setIsSettledExpanded] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await getGroups();
      const groupsList = response.data.groups;

      if (user?._id) {
        const settlementPromises = groupsList.map(async (group) => {
          const status = await calculateSettlementStatus(group._id, user._id);
          return { ...group, settlementStatus: status };
        });
        const groupsWithSettlements = await Promise.all(settlementPromises);

        const active = groupsWithSettlements.filter(
          (g) => !g.settlementStatus.isSettled
        );
        const settled = groupsWithSettlements.filter(
          (g) => g.settlementStatus.isSettled
        );

        setActiveGroups(active);
        setSettledGroups(settled);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      Alert.alert("Error", "Failed to fetch groups.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSettlementStatus = async (groupId, userId) => {
    try {
      const response = await getOptimizedSettlements(groupId);
      const settlements = response.data.optimizedSettlements || [];
      const userOwes = settlements.filter((s) => s.fromUserId === userId);
      const userIsOwed = settlements.filter((s) => s.toUserId === userId);
      return {
        isSettled: userOwes.length === 0 && userIsOwed.length === 0,
        netBalance:
          userIsOwed.reduce((sum, s) => sum + s.amount, 0) -
          userOwes.reduce((sum, s) => sum + s.amount, 0),
      };
    } catch (error) {
      return { isSettled: true, netBalance: 0 };
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
      await fetchGroups();
    } catch (error) {
      console.error("Failed to create group:", error);
      Alert.alert("Error", "Failed to create group.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const toggleSettledGroups = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSettledExpanded(!isSettledExpanded);
  };

  const activeGroupRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < activeGroups.length; i += 2) {
      rows.push(activeGroups.slice(i, i + 2));
    }
    return rows;
  }, [activeGroups]);

  const renderGroupRow = ({ item: row }) => (
    <View style={styles.row}>
      {row.map((item) => (
        <TouchableOpacity
          key={item._id}
          style={styles.card}
          onPress={() =>
            navigation.navigate("GroupDetails", {
              groupId: item._id,
              groupName: item.name,
              groupIcon: item.imageUrl || item.name?.charAt(0) || "?",
            })
          }
        >
          {/^(https?:|data:image)/.test(item.imageUrl) ? (
            <Avatar.Image
              size={60}
              source={{ uri: item.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={60}
              label={item.imageUrl || item.name?.charAt(0) || "?"}
              style={styles.avatar}
              labelStyle={{ ...typography.h2, color: colors.white }}
            />
          )}
          <Text style={styles.groupName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text
            style={[
              styles.settlementStatus,
              {
                color:
                  item.settlementStatus.netBalance > 0
                    ? colors.success
                    : colors.error,
              },
            ]}
          >
            {item.settlementStatus.netBalance > 0
              ? `You are owed ${formatCurrency(
                  item.settlementStatus.netBalance
                )}`
              : `You owe ${formatCurrency(
                  Math.abs(item.settlementStatus.netBalance)
                )}`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSettledGroup = ({ item }) => (
    <TouchableOpacity
      style={styles.settledCard}
      onPress={() =>
        navigation.navigate("GroupDetails", {
          groupId: item._id,
          groupName: item.name,
        })
      }
    >
      <Text style={styles.settledGroupName}>{item.name}</Text>
      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
    </TouchableOpacity>
  );

  const renderSettledGroupsExpander = () => {
    if (settledGroups.length === 0) return null;

    return (
      <View style={styles.expanderContainer}>
        <TouchableOpacity
          style={styles.expanderHeader}
          onPress={toggleSettledGroups}
        >
          <Text style={styles.expanderTitle}>Settled Groups</Text>
          <Ionicons
            name={
              isSettledExpanded ? "chevron-up-outline" : "chevron-down-outline"
            }
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {isSettledExpanded && (
          <View>{settledGroups.map((item) => renderSettledGroup({ item }))}</View>
        )}
      </View>
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
          <Text style={styles.modalTitle}>Create a New Group</Text>
          <TextInput
            label="Group Name"
            value={newGroupName}
            onChangeText={setNewGroupName}
            style={styles.input}
            theme={{ colors: { primary: colors.accent } }}
          />
          <Button
            mode="contained"
            onPress={handleCreateGroup}
            loading={isCreatingGroup}
            disabled={isCreatingGroup}
            style={styles.createButton}
            labelStyle={{ color: colors.white }}
          >
            Create
          </Button>
        </Modal>
      </Portal>

      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        <Appbar.Content
          title="Your Groups"
          color={colors.white}
          titleStyle={{ fontWeight: "bold" }}
        />
        <Appbar.Action icon="plus" color={colors.white} onPress={showModal} />
        <Appbar.Action
          icon="account-plus"
          color={colors.white}
          onPress={() =>
            navigation.navigate("JoinGroup", { onGroupJoined: fetchGroups })
          }
        />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <View style={styles.row}>
            <GroupCardSkeleton />
            <GroupCardSkeleton />
          </View>
          <View style={styles.row}>
            <GroupCardSkeleton />
            <GroupCardSkeleton />
          </View>
          <View style={styles.row}>
            <GroupCardSkeleton />
            <GroupCardSkeleton />
          </View>
        </View>
      ) : (
        <FlatList
          data={activeGroupRows}
          renderItem={renderGroupRow}
          keyExtractor={(item, index) => `row-${index}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No active groups. Create or join one!
                </Text>
              </View>
            )
          }
          ListFooterComponent={renderSettledGroupsExpander}
          onRefresh={fetchGroups}
          refreshing={isLoading}
        />
      )}
    </View>
  );
};

const GroupCardSkeleton = () => (
  <View style={styles.card}>
    <SkeletonLoader style={{ width: 60, height: 60, borderRadius: 30, marginBottom: spacing.md }} />
    <SkeletonLoader style={{ width: '80%', height: 20, marginBottom: spacing.xs }} />
    <SkeletonLoader style={{ width: '60%', height: 20 }} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loaderContainer: {
    flex: 1,
    padding: spacing.md,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    padding: spacing.md,
    margin: spacing.sm,
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  groupName: {
    ...typography.h3,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  settlementStatus: {
    ...typography.body,
    textAlign: "center",
  },
  settledCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  settledGroupName: {
    ...typography.body,
    color: colors.text,
  },
  expanderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  expanderTitle: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
    width: "100%",
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: spacing.sm,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.lg,
    backgroundColor: colors.secondary,
  },
  createButton: {
    backgroundColor: colors.primary,
  },
});

export default HomeScreen;
