import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Divider,
  Text,
} from "react-native-paper";
import { getFriendsBalance, getGroups } from "../api/groups";
import SkeletonLoader from "../components/SkeletonLoader";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";
import { formatCurrency } from "../utils/currency";

const FriendItem = ({ item, onToggle, isExpanded }) => {
  const balanceColor =
    item.netBalance < 0 ? colors.error : colors.success;
  const balanceText =
    item.netBalance < 0
      ? `You owe ${formatCurrency(Math.abs(item.netBalance))}`
      : `Owes you ${formatCurrency(item.netBalance)}`;

  return (
    <View style={styles.friendCard}>
      <TouchableOpacity style={styles.friendHeader} onPress={onToggle}>
        <Avatar.Image
          size={48}
          source={{
            uri:
              item.imageUrl ||
              `https://avatar.iran.liara.run/username?username=${item.name}`,
          }}
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={[styles.friendBalance, { color: balanceColor }]}>
            {item.netBalance !== 0 ? balanceText : "Settled up"}
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
          size={24}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.groupBreakdown}>
          <Divider />
          {item.groups.map((group) => (
            <View key={group.id} style={styles.groupItem}>
              <Avatar.Image
                size={32}
                source={{
                  uri:
                    group.imageUrl ||
                    `https://avatar.iran.liara.run/username?username=${group.name}`,
                }}
              />
              <Text style={styles.groupName}>{group.name}</Text>
              <Text
                style={{
                  color: group.balance < 0 ? colors.error : colors.success,
                }}
              >
                {formatCurrency(group.balance)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const FriendItemSkeleton = () => (
  <View style={styles.friendCard}>
    <View style={styles.friendHeader}>
      <SkeletonLoader style={{ width: 48, height: 48, borderRadius: 24 }} />
      <View style={styles.friendInfo}>
        <SkeletonLoader style={{ width: '70%', height: 20, marginBottom: spacing.xs }} />
        <SkeletonLoader style={{ width: '50%', height: 16 }} />
      </View>
    </View>
  </View>
);

const FriendsScreen = () => {
  const { token } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFriend, setExpandedFriend] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [friendsResponse, groupsResponse] = await Promise.all([
          getFriendsBalance(),
          getGroups(),
        ]);
        const friendsData = friendsResponse.data.friendsBalance || [];
        const groupMeta = new Map(
          (groupsResponse.data.groups || []).map((g) => [
            g._id,
            { name: g.name, imageUrl: g.imageUrl },
          ])
        );
        const transformedFriends = friendsData.map((friend) => ({
          id: friend.userId,
          name: friend.userName,
          imageUrl: friend.userImageUrl,
          netBalance: friend.netBalance,
          groups: (friend.breakdown || []).map((group) => ({
            id: group.groupId,
            name: groupMeta.get(group.groupId)?.name || "Unknown Group",
            balance: group.balance,
            imageUrl: groupMeta.get(group.groupId)?.imageUrl,
          })),
        }));
        setFriends(transformedFriends);
      } catch (error) {
        Alert.alert("Error", "Failed to load friends balance data.");
      } finally {
        setIsLoading(false);
      }
    };
    if (token && isFocused) fetchData();
  }, [token, isFocused]);

  const handleToggleFriend = (friendId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFriend(expandedFriend === friendId ? null : friendId);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={{ backgroundColor: colors.primary }}>
          <Appbar.Content
            title="Friends"
            color={colors.white}
            titleStyle={{ ...typography.h2 }}
          />
        </Appbar.Header>
        <View style={styles.listContent}>
          <FriendItemSkeleton />
          <FriendItemSkeleton />
          <FriendItemSkeleton />
          <FriendItemSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        <Appbar.Content
          title="Friends"
          color={colors.white}
          titleStyle={{ ...typography.h2 }}
        />
      </Appbar.Header>
      <FlatList
        data={friends}
        renderItem={({ item }) => (
          <FriendItem
            item={item}
            isExpanded={expandedFriend === item.id}
            onToggle={() => handleToggleFriend(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No balances with friends yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  listContent: {
    padding: spacing.md,
  },
  friendCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  friendHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  friendName: {
    ...typography.h3,
    color: colors.text,
  },
  friendBalance: {
    ...typography.body,
  },
  groupBreakdown: {
    marginTop: spacing.md,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  groupName: {
    flex: 1,
    marginLeft: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  emptyText: {
    textAlign: "center",
    marginTop: spacing.xl,
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default FriendsScreen;
