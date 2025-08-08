import { useIsFocused } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Appbar,
    Avatar,
    Divider,
    IconButton,
    List,
    Text,
} from "react-native-paper";
import { getFriendsBalance, getGroupMembers, getGroups } from "../api/groups";
import { AuthContext } from "../context/AuthContext";

const FriendsScreen = () => {
  const { token, user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch friends balance data
        const friendsResponse = await getFriendsBalance();
        const friendsData = friendsResponse.data.friendsBalance || [];

        // Fetch all groups to get member details with user images
        const groupsResponse = await getGroups();
        const groups = groupsResponse.data.groups || [];

        // Create a map of userId to user details by fetching all group members
        const userDetailsMap = new Map();

    for (const group of groups) {
          try {
      // Use backend group id key `_id` when fetching members
      const membersResponse = await getGroupMembers(group._id || group.id);
            const members = membersResponse.data || [];

            members.forEach((member) => {
              if (member.user && member.userId) {
                userDetailsMap.set(member.userId, member.user);
              }
            });
          } catch (error) {
            console.warn(
              `Failed to fetch members for group ${group.id}:`,
              error
            );
          }
        }

        // Transform the backend data and enrich with user details
        const transformedFriends = friendsData.map((friend) => {
          const userDetails = userDetailsMap.get(friend.userId);

          return {
            id: friend.userId,
            name: friend.userName,
            imageUrl: userDetails?.imageUrl || null,
            netBalance: friend.netBalance,
            groups: friend.breakdown.map((group) => ({
              id: group.groupId,
              name: group.groupName,
              balance: group.balance,
            })),
          };
        });

        setFriends(transformedFriends);
      } catch (error) {
        console.error("Failed to fetch friends balance data:", error);
        Alert.alert("Error", "Failed to load friends balance data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (token && isFocused) {
      fetchData();
    }
  }, [token, isFocused]);

  const renderFriend = ({ item }) => {
    const balanceColor = item.netBalance < 0 ? "red" : "green";
    const balanceText =
      item.netBalance < 0
        ? `You owe $${Math.abs(item.netBalance).toFixed(2)}`
        : `Owes you $${item.netBalance.toFixed(2)}`;

    // Determine if we have an image URL or a base64 payload
    const hasImage = !!item.imageUrl;
    let imageUri = null;
    if (hasImage) {
      // If it's a raw base64 string without prefix, add a default MIME prefix
      if (/^data:image/.test(item.imageUrl) || /^https?:\/\//.test(item.imageUrl)) {
        imageUri = item.imageUrl;
      } else if (/^[A-Za-z0-9+/=]+$/.test(item.imageUrl.substring(0, 50))) {
        imageUri = `data:image/jpeg;base64,${item.imageUrl}`;
      }
    }

    return (
      <List.Accordion
        title={item.name}
        description={item.netBalance !== 0 ? balanceText : "Settled up"}
        descriptionStyle={{
          color: item.netBalance !== 0 ? balanceColor : "gray",
        }}
        left={(props) =>
          imageUri ? (
            <Avatar.Image {...props} size={40} source={{ uri: imageUri }} />
          ) : (
            <Avatar.Text
              {...props}
              size={40}
              label={(item.name || "?").charAt(0)}
            />
          )
        }
      >
        {item.groups.map((group) => {
          const groupBalanceColor = group.balance < 0 ? "red" : "green";
          const groupBalanceText =
            group.balance < 0
              ? `You owe $${Math.abs(group.balance).toFixed(2)}`
              : `Owes you $${group.balance.toFixed(2)}`;

          return (
            <List.Item
              key={group.id}
              title={group.name}
              description={groupBalanceText}
              descriptionStyle={{ color: groupBalanceColor }}
              left={(props) => <List.Icon {...props} icon="group" />}
            />
          );
        })}
      </List.Accordion>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Friends" />
      </Appbar.Header>
      {showTooltip && (
        <View style={styles.explanationContainer}>
          <View style={styles.explanationContent}>
            <Text style={styles.explanationText}>
              💡 These amounts show your direct balance with each friend across
              all shared groups. Check individual group details for optimized
              settlement suggestions.
            </Text>
            <IconButton
              icon="close"
              size={16}
              onPress={() => setShowTooltip(false)}
              style={styles.closeButton}
            />
          </View>
        </View>
      )}
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Divider}
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
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  explanationContainer: {
    backgroundColor: "#f0f8ff",
    margin: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  explanationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
  },
  explanationText: {
    fontSize: 12,
    color: "#555",
    lineHeight: 16,
    flex: 1,
    paddingRight: 8,
  },
  closeButton: {
    margin: 0,
    marginTop: -4,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
  },
});

export default FriendsScreen;
