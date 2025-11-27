import { useContext, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View, Animated } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Card,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import { createGroup, getGroups, getOptimizedSettlements } from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { formatCurrency, getCurrencySymbol } from "../utils/currency";
import { useTheme } from "../context/ThemeContext";
import { THEMES, COLORS } from "../constants/theme";
import { ThemeWrapper } from "../components/ThemeWrapper";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const { token, logout, user } = useContext(AuthContext);
  const { style, mode } = useTheme();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupSettlements, setGroupSettlements] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);

  const calculateSettlementStatus = async (groupId, userId) => {
    try {
      const response = await getOptimizedSettlements(groupId);
      const settlements = response.data.optimizedSettlements || [];

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
      await fetchGroups();
    } catch (error) {
      console.error("Failed to create group:", error);
      Alert.alert("Error", "Failed to create group.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const renderGroup = ({ item }) => {
    const settlementStatus = groupSettlements[item._id];

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
        return `You owe ${formatCurrency(Math.abs(settlementStatus.netBalance))}.`;
      }
      return "You are settled up.";
    };

    const getStatusColor = () => {
      if (!settlementStatus || settlementStatus.isSettled) {
        return COLORS.neo.accent;
      }
      if (settlementStatus.netBalance > 0) {
        return COLORS.neo.accent;
      } else if (settlementStatus.netBalance < 0) {
        return style === THEMES.NEOBRUTALISM ? '#ff4444' : '#ff6b6b';
      }
      return COLORS.neo.accent;
    };

    const isImage = item.imageUrl && /^(https?:|data:image)/.test(item.imageUrl);
    const groupIcon = item.imageUrl || item.name?.charAt(0) || "?";

    // Neo-Brutalism Styles
    const cardStyle = style === THEMES.NEOBRUTALISM ? {
      backgroundColor: mode === 'dark' ? COLORS.neo.dark : COLORS.neo.white,
      borderWidth: 3,
      borderColor: COLORS.neo.dark,
      borderRadius: 0,
      shadowColor: COLORS.neo.dark,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 0, // Disable android elevation for clean neo look
      marginBottom: 16,
    } : {
      // Glassmorphism Styles
      backgroundColor: mode === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      borderRadius: 16,
      marginBottom: 16,
      elevation: 4,
    };

    const textColor = style === THEMES.NEOBRUTALISM && mode !== 'dark' ? COLORS.neo.dark : COLORS.neo.white;

    return (
      <Card
        style={cardStyle}
        onPress={() =>
          navigation.navigate("GroupDetails", {
            groupId: item._id,
            groupName: item.name,
            groupIcon,
          })
        }
      >
        <Card.Title
          title={item.name}
          titleStyle={{
            fontFamily: 'SpaceGrotesk_700Bold',
            fontSize: 18,
            color: style === THEMES.NEOBRUTALISM ? (mode === 'dark' ? COLORS.neo.white : COLORS.neo.dark) : (mode === 'dark' ? 'white' : 'black')
          }}
          left={(props) =>
            isImage ? (
              <Avatar.Image {...props} source={{ uri: item.imageUrl }} style={{ backgroundColor: 'transparent' }} />
            ) : (
              <View style={{
                width: 40, height: 40,
                backgroundColor: COLORS.neo.main,
                justifyContent: 'center', alignItems: 'center',
                borderWidth: style === THEMES.NEOBRUTALISM ? 2 : 0,
                borderColor: COLORS.neo.dark,
              }}>
                 <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', color: 'white' }}>{groupIcon}</Text>
              </View>
            )
          }
        />
        <Card.Content>
          <Text style={[styles.settlementStatus, { color: getStatusColor(), fontFamily: 'Inter_400Regular' }]}>
            {getSettlementStatusText()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const headerStyle = {
      backgroundColor: style === THEMES.NEOBRUTALISM ? COLORS.neo.main : 'transparent',
      elevation: 0,
      borderBottomWidth: style === THEMES.NEOBRUTALISM ? 3 : 0,
      borderBottomColor: COLORS.neo.dark,
  };

  const contentColor = style === THEMES.NEOBRUTALISM ? 'white' : (mode === 'dark' ? 'white' : COLORS.neo.dark);

  return (
    <ThemeWrapper>
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={[
              styles.modalContainer,
              style === THEMES.NEOBRUTALISM ? {
                  borderWidth: 3,
                  borderColor: COLORS.neo.dark,
                  borderRadius: 0,
                  shadowOffset: { width: 4, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  shadowColor: COLORS.neo.dark,
              } : {
                  borderRadius: 16,
                  backgroundColor: mode === 'dark' ? '#1e1e1e' : 'white',
              }
          ]}
        >
          <Text style={[styles.modalTitle, { fontFamily: 'SpaceGrotesk_700Bold' }]}>Create a New Group</Text>
          <TextInput
            label="Group Name"
            value={newGroupName}
            onChangeText={setNewGroupName}
            style={[styles.input, { backgroundColor: 'transparent' }]}
            mode="outlined"
            outlineColor={COLORS.neo.dark}
            activeOutlineColor={COLORS.neo.main}
          />
          <Button
            mode="contained"
            onPress={handleCreateGroup}
            loading={isCreatingGroup}
            disabled={isCreatingGroup}
            style={{
                borderRadius: style === THEMES.NEOBRUTALISM ? 0 : 20,
                borderWidth: style === THEMES.NEOBRUTALISM ? 2 : 0,
                borderColor: COLORS.neo.dark,
                backgroundColor: COLORS.neo.second,
            }}
            labelStyle={{ fontFamily: 'SpaceGrotesk_700Bold', color: COLORS.neo.dark }}
          >
            Create
          </Button>
        </Modal>
      </Portal>

      <Appbar.Header style={headerStyle}>
        <Appbar.Content title="Your Groups" titleStyle={{ fontFamily: 'SpaceGrotesk_700Bold', color: contentColor }} />
        <Appbar.Action icon="plus" color={contentColor} onPress={showModal} />
        <Appbar.Action
          icon="account-plus"
          color={contentColor}
          onPress={() =>
            navigation.navigate("JoinGroup", { onGroupJoined: fetchGroups })
          }
        />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.neo.main} />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { fontFamily: 'Inter_400Regular', color: mode === 'dark' ? 'white' : 'black' }]}>
              No groups found. Create or join one!
            </Text>
          }
          onRefresh={fetchGroups}
          refreshing={isLoading}
        />
      )}
    </ThemeWrapper>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
  },
  settlementStatus: {
    fontWeight: "500",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 20,
  },
});

export default HomeScreen;
