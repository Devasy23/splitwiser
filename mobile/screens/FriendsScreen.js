import { useIsFocused } from "@react-navigation/native";
import { useContext, useEffect, useRef, useState } from "react";
import { Alert, Animated, FlatList, StyleSheet, View } from "react-native";
import {
  Appbar,
  Avatar,
  Divider,
  IconButton,
  List,
  Text,
} from "react-native-paper";
import { getFriendsBalance, getGroups } from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { formatCurrency } from "../utils/currency";
import { ThemeWrapper } from "../components/ThemeWrapper";
import { useTheme } from "../context/ThemeContext";
import { THEMES, COLORS } from "../constants/theme";

const FriendsScreen = () => {
  const { token, user } = useContext(AuthContext);
  const { style, mode } = useTheme();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const friendsResponse = await getFriendsBalance();
        const friendsData = friendsResponse.data.friendsBalance || [];
        const groupsResponse = await getGroups();
        const groups = groupsResponse?.data?.groups || [];
        const groupMeta = new Map(
          groups.map((g) => [g._id, { name: g.name, imageUrl: g.imageUrl }])
        );

        const transformedFriends = friendsData.map((friend) => ({
          id: friend.userId,
          name: friend.userName,
          imageUrl: friend.userImageUrl || null,
          netBalance: friend.netBalance,
          groups: (friend.breakdown || []).map((group) => ({
            id: group.groupId,
            name: group.groupName,
            balance: group.balance,
            imageUrl: groupMeta.get(group.groupId)?.imageUrl || null,
          })),
        }));

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
    const balanceColor = item.netBalance < 0 ? (style === THEMES.NEOBRUTALISM ? '#ff4444' : '#ff6b6b') : COLORS.neo.accent;
    const balanceText =
      item.netBalance < 0
        ? `You owe ${formatCurrency(Math.abs(item.netBalance))}`
        : `Owes you ${formatCurrency(item.netBalance)}`;

    const hasImage = !!item.imageUrl;
    let imageUri = null;
    if (hasImage) {
      if (
        /^data:image/.test(item.imageUrl) ||
        /^https?:\/\//.test(item.imageUrl)
      ) {
        imageUri = item.imageUrl;
      } else if (/^[A-Za-z0-9+/=]+$/.test(item.imageUrl.substring(0, 50))) {
        imageUri = `data:image/jpeg;base64,${item.imageUrl}`;
      }
    }

    const listItemStyle = style === THEMES.NEOBRUTALISM ? {
        backgroundColor: mode === 'dark' ? COLORS.neo.dark : COLORS.neo.white,
        borderWidth: 2,
        borderColor: COLORS.neo.dark,
        marginBottom: 8,
    } : {
        backgroundColor: mode === 'dark' ? 'rgba(30,30,30,0.4)' : 'rgba(255,255,255,0.4)',
        borderRadius: 8,
        marginBottom: 8,
    };

    const textColor = style === THEMES.NEOBRUTALISM && mode !== 'dark' ? COLORS.neo.dark : COLORS.neo.white;

    return (
      <View style={listItemStyle}>
      <List.Accordion
        title={item.name}
        titleStyle={{ fontFamily: 'SpaceGrotesk_700Bold', color: textColor }}
        description={item.netBalance !== 0 ? balanceText : "Settled up"}
        descriptionStyle={{
          color: item.netBalance !== 0 ? balanceColor : "gray",
          fontFamily: 'Inter_400Regular'
        }}
        style={{ backgroundColor: 'transparent' }}
        left={(props) =>
          imageUri ? (
            <Avatar.Image {...props} size={40} source={{ uri: imageUri }} />
          ) : (
            <Avatar.Text
              {...props}
              size={40}
              label={(item.name || "?").charAt(0)}
              style={{ backgroundColor: COLORS.neo.main }}
              labelStyle={{ fontFamily: 'SpaceGrotesk_700Bold' }}
            />
          )
        }
      >
        {item.groups.map((group) => {
          const groupBalanceColor = group.balance < 0 ? (style === THEMES.NEOBRUTALISM ? '#ff4444' : '#ff6b6b') : COLORS.neo.accent;
          const groupBalanceText =
            group.balance < 0
              ? `You owe ${formatCurrency(Math.abs(group.balance))}`
              : `Owes you ${formatCurrency(group.balance)}`;

          let groupImageUri = null;
          if (group.imageUrl) {
            if (
              /^data:image/.test(group.imageUrl) ||
              /^https?:\/\//.test(group.imageUrl)
            ) {
              groupImageUri = group.imageUrl;
            } else if (
              /^[A-Za-z0-9+/=]+$/.test(group.imageUrl.substring(0, 50))
            ) {
              groupImageUri = `data:image/jpeg;base64,${group.imageUrl}`;
            }
          }

          return (
            <List.Item
              key={group.id}
              title={group.name}
              titleStyle={{ fontFamily: 'Inter_400Regular', color: textColor }}
              description={groupBalanceText}
              descriptionStyle={{ color: groupBalanceColor, fontFamily: 'Inter_400Regular' }}
              left={(props) =>
                groupImageUri ? (
                  <Avatar.Image
                    {...props}
                    size={36}
                    source={{ uri: groupImageUri }}
                  />
                ) : (
                  <Avatar.Text
                    {...props}
                    size={36}
                    label={(group.name || "?").charAt(0)}
                    style={{ backgroundColor: COLORS.neo.second }}
                  />
                )
              }
            />
          );
        })}
      </List.Accordion>
      </View>
    );
  };

  const opacityAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacityAnim]);

  const SkeletonRow = () => (
    <View style={styles.skeletonRow}>
      <Animated.View
        style={[styles.skeletonAvatar, { opacity: opacityAnim, backgroundColor: mode === 'dark' ? '#333' : '#e0e0e0' }]}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Animated.View
          style={[styles.skeletonLine, { width: "60%", opacity: opacityAnim, backgroundColor: mode === 'dark' ? '#333' : '#e0e0e0' }]}
        />
        <Animated.View
          style={[
            styles.skeletonLineSmall,
            { width: "40%", opacity: opacityAnim, backgroundColor: mode === 'dark' ? '#333' : '#e0e0e0' },
          ]}
        />
      </View>
    </View>
  );

  const headerStyle = {
      backgroundColor: style === THEMES.NEOBRUTALISM ? COLORS.neo.main : 'transparent',
      elevation: 0,
      borderBottomWidth: style === THEMES.NEOBRUTALISM ? 3 : 0,
      borderBottomColor: COLORS.neo.dark,
  };
  const contentColor = style === THEMES.NEOBRUTALISM ? 'white' : (mode === 'dark' ? 'white' : COLORS.neo.dark);

  if (isLoading) {
    return (
      <ThemeWrapper>
        <Appbar.Header style={headerStyle}>
          <Appbar.Content title="Friends" titleStyle={{ fontFamily: 'SpaceGrotesk_700Bold', color: contentColor }} />
        </Appbar.Header>
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      </ThemeWrapper>
    );
  }

  return (
    <ThemeWrapper>
      <Appbar.Header style={headerStyle}>
        <Appbar.Content title="Friends" titleStyle={{ fontFamily: 'SpaceGrotesk_700Bold', color: contentColor }} />
      </Appbar.Header>
      {showTooltip && (
        <View style={[styles.explanationContainer,
            style === THEMES.NEOBRUTALISM ? {
                backgroundColor: COLORS.neo.lightBg,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.neo.main,
                borderWidth: 2,
                borderColor: COLORS.neo.dark,
                borderRadius: 0,
            } : {
                backgroundColor: 'rgba(240, 248, 255, 0.8)',
                borderRadius: 8,
            }
        ]}>
          <View style={styles.explanationContent}>
            <Text style={[styles.explanationText, { fontFamily: 'Inter_400Regular' }]}>
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
        ItemSeparatorComponent={style === THEMES.NEOBRUTALISM ? null : Divider}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: mode === 'dark' ? 'white' : 'black', fontFamily: 'Inter_400Regular' }]}>No balances with friends yet.</Text>
        }
      />
    </ThemeWrapper>
  );
};

const styles = StyleSheet.create({
  explanationContainer: {
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
  skeletonContainer: {
    padding: 16,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 6,
    marginBottom: 6,
  },
  skeletonLineSmall: {
    height: 12,
    borderRadius: 6,
  },
});

export default FriendsScreen;
