import { useTheme } from "@react-navigation/native";
import { useContext, useEffect, useRef, useState } from "react";
import { Alert, Animated, FlatList, Pressable, StyleSheet, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Card,
  Chip,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { createGroup, getGroups, getOptimizedSettlements } from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { formatCurrency, getCurrencySymbol } from "../utils/currency";
import { tokens } from "../utils/theme";

const HomeScreen = ({ navigation }) => {
  const { token, logout, user } = useContext(AuthContext);
  const { colors } = useTheme();
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

  // Simple mount animation for list items
  const itemAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [groups]);

  const renderGroup = ({ item, index }) => {
    const settlementStatus = groupSettlements[item._id];

    // Generate settlement status text
    const getSettlementStatusText = () => {
      if (!settlementStatus) {
        return "Calculating balances...";
      }

      if (settlementStatus.isSettled) {
        return "✓ You are settled up.";
      }

      if (settlementStatus.netBalance > 0) {
        return `You are owed ${formatCurrency(settlementStatus.netBalance)}.`;
      } else if (settlementStatus.netBalance < 0) {
        return `You owe ${formatCurrency(
          Math.abs(settlementStatus.netBalance)
        )}.`;
      }

      return "You are settled up.";
    };

    // Get text color based on settlement status
    const getStatusColor = () => {
      if (!settlementStatus || settlementStatus.isSettled) {
        return tokens.success; // Green for settled
      }

      if (settlementStatus.netBalance > 0) {
        return tokens.success; // Green for being owed money
      } else if (settlementStatus.netBalance < 0) {
        return tokens.danger; // Red for owing money
      }

      return tokens.success; // Default green
    };

    const isImage =
      item.imageUrl && /^(https?:|data:image)/.test(item.imageUrl);
    const groupIcon = item.imageUrl || item.name?.charAt(0) || "?";
    // Press animation
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () => {
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }).start();
    };
    const onPressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }).start();
    };

    const openDetails = () =>
      navigation.navigate("GroupDetails", {
        groupId: item._id,
        groupName: item.name,
        groupIcon,
      });

    const renderRightActions = () => (
      <View style={styles.swipeActions}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: tokens.tertiary }]}
          onPress={() => navigation.navigate("AddExpense", { groupId: item._id })}
        >
          <Text style={styles.actionText}>Add</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("GroupSettings", { groupId: item._id })}
        >
          <Text style={styles.actionText}>Settings</Text>
        </Pressable>
      </View>
    );

    const renderLeftActions = () => (
      <View style={[styles.swipeActions, { justifyContent: "flex-start" }]}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: tokens.info }]}
          onPress={openDetails}
        >
          <Text style={styles.actionText}>Open</Text>
        </Pressable>
      </View>
    );

    return (
      <Animated.View
        style={{
          transform: [
            { scale },
            {
              translateY: itemAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
          opacity: itemAnim,
        }}
      >
        <Swipeable renderRightActions={renderRightActions} renderLeftActions={renderLeftActions}>
          <Pressable onPress={openDetails} onPressIn={onPressIn} onPressOut={onPressOut}>
            <Card style={[styles.card, { backgroundColor: colors.card }]}> 
              <Card.Title
                title={item.name}
                titleStyle={styles.cardTitle}
                left={(props) =>
                  isImage ? (
                    <Avatar.Image {...props} source={{ uri: item.imageUrl }} />
                  ) : (
                    <Avatar.Text {...props} label={groupIcon} />
                  )
                }
              />
              <Card.Content>
                <View style={styles.rowBetween}>
                  <Text style={[styles.settlementStatus, { color: getStatusColor() }]}>
                    {getSettlementStatusText()}
                  </Text>
                  <Chip compact selectedColor={colors.onSurface}>
                    {item.members?.length || item.memberCount || 0} members
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          </Pressable>
        </Swipeable>
      </Animated.View>
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
        <Appbar.Action icon="plus" onPress={showModal} />
        <Appbar.Action
          icon="account-plus"
          onPress={() =>
            navigation.navigate("JoinGroup", { onGroupJoined: fetchGroups })
          }
        />
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
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No groups found. Create or join one!
            </Text>
          }
          onRefresh={fetchGroups}
          refreshing={isLoading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  settlementStatus: {
    fontWeight: "600",
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 20,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default HomeScreen;
