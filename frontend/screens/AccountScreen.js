import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Avatar, Divider, Text } from "react-native-paper";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";

const AccountScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  const handleComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is not yet implemented.");
  };

  const menuItems = [
    {
      title: "Edit Profile",
      icon: "person-outline",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      title: "Email Settings",
      icon: "mail-outline",
      onPress: handleComingSoon,
    },
    {
      title: "Send Feedback",
      icon: "chatbubble-ellipses-outline",
      onPress: handleComingSoon,
    },
    {
      title: "Logout",
      icon: "log-out-outline",
      onPress: handleLogout,
      color: colors.error,
    },
  ];

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        <Appbar.Content
          title="Account"
          color={colors.white}
          titleStyle={{ ...typography.h2 }}
        />
      </Appbar.Header>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          {user?.imageUrl && /^(https?:|data:image)/.test(user.imageUrl) ? (
            <Avatar.Image
              size={100}
              source={{ uri: user.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={100}
              label={user?.name?.charAt(0) || "A"}
              style={styles.avatar}
              labelStyle={{ ...typography.h1, color: colors.white }}
            />
          )}
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <View key={item.title}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={item.color || colors.primary}
                  style={styles.menuIcon}
                />
                <Text
                  style={[styles.menuItemText, { color: item.color || colors.text }]}
                >
                  {item.title}
                </Text>
                <Ionicons
                  name="chevron-forward-outline"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  content: {
    padding: spacing.md,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.sm,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  name: {
    ...typography.h2,
    marginTop: spacing.md,
    color: colors.text,
  },
  email: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    flex: 1,
  },
});

export default AccountScreen;
