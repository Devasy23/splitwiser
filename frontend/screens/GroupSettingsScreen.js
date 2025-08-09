import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Divider,
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";
import {
  deleteGroup as apiDeleteGroup,
  getGroupById,
  getGroupMembers,
  getOptimizedSettlements,
  leaveGroup as apiLeaveGroup,
  removeMember as apiRemoveMember,
  updateGroup as apiUpdateGroup,
} from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";

const ICON_CHOICES = ["👥", "🏠", "🎉", "🧳", "🍽️", "🚗", "🏖️", "🎮", "💼"];

const GroupSettingsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [group, setGroup] = useState(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [pickedImage, setPickedImage] = useState(null);

  const isAdmin = useMemo(
    () => members.find((m) => m.userId === user?._id)?.role === "admin",
    [members, user?._id]
  );

  const load = async () => {
    try {
      setLoading(true);
      const [gRes, mRes] = await Promise.all([
        getGroupById(groupId),
        getGroupMembers(groupId),
      ]);
      setGroup(gRes.data);
      setName(gRes.data.name);
      setIcon(gRes.data.imageUrl || "");
      setMembers(mRes.data);
    } catch (e) {
      Alert.alert("Error", "Failed to load group settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) load();
  }, [groupId]);

  const onSave = async () => {
    if (!isAdmin) return;
    const updates = {};
    if (name && name !== group?.name) updates.name = name;
    if (pickedImage?.base64) {
      updates.imageUrl = `data:image/jpeg;base64,${pickedImage.base64}`;
    } else if (icon !== group?.imageUrl) {
      updates.imageUrl = icon;
    }

    if (Object.keys(updates).length === 0) return;
    try {
      setSaving(true);
      const res = await apiUpdateGroup(groupId, updates);
      setGroup(res.data);
      if (pickedImage) setPickedImage(null);
      Alert.alert("Success", "Group updated successfully.");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.detail || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const onKick = (memberId, memberName) => {
    Alert.alert(
      "Kick Member",
      `Are you sure you want to kick ${memberName} from the group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Kick",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRemoveMember(groupId, memberId);
              setMembers(members.filter((m) => m.userId !== memberId));
              Alert.alert("Success", `${memberName} has been kicked.`);
            } catch (error) {
              Alert.alert("Error", "Failed to kick member.");
            }
          },
        },
      ]
    );
  };

  const onLeave = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await apiLeaveGroup(groupId);
              navigation.popToTop();
            } catch (error) {
              Alert.alert("Error", "Failed to leave group.");
            }
          },
        },
      ]
    );
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join my group on MySplitApp! Use this code: ${group?.joinCode}`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share invite code.");
    }
  };

  const pickImage = async () => {
    if (!isAdmin) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0]);
      setIcon(""); // Clear emoji icon when image is picked
    }
  };

  const onDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteGroup(groupId);
              navigation.popToTop();
            } catch (error) {
              Alert.alert("Error", "Failed to delete group.");
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = (m) => {
    const isSelf = m.userId === user?._id;
    return (
      <View key={m.userId} style={styles.memberItem}>
        <Avatar.Image
          size={40}
          source={{
            uri:
              m.user?.imageUrl ||
              `https://avatar.iran.liara.run/username?username=${m.user?.name}`,
          }}
        />
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{m.user?.name || "Unknown"}</Text>
          {m.role === "admin" && (
            <Text style={styles.memberRole}>Admin</Text>
          )}
        </View>
        {isAdmin && !isSelf && (
          <IconButton
            icon="account-remove"
            iconColor={colors.error}
            onPress={() => onKick(m.userId, m.user?.name)}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.white}
        />
        <Appbar.Content
          title="Group Settings"
          color={colors.white}
          titleStyle={{ ...typography.h2 }}
        />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Group Info</Text>
          <TextInput
            label="Group Name"
            value={name}
            onChangeText={setName}
            editable={isAdmin}
            style={styles.input}
            theme={{ colors: { primary: colors.accent } }}
          />
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconRow}>
            {ICON_CHOICES.map((i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.iconBtn,
                  icon === i && { backgroundColor: colors.primary },
                ]}
                onPress={() => setIcon(i)}
                disabled={!isAdmin}
              >
                <Text style={{ fontSize: 24 }}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button
            mode="outlined"
            onPress={pickImage}
            disabled={!isAdmin}
            icon="image"
            style={styles.imageButton}
            labelStyle={{ color: colors.primary }}
          >
            {pickedImage ? "Change Image" : "Upload Image"}
          </Button>
          {isAdmin && (
            <Button
              mode="contained"
              style={styles.saveButton}
              labelStyle={{ color: colors.white }}
              loading={saving}
              disabled={saving}
              onPress={onSave}
            >
              Save Changes
            </Button>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Members</Text>
          {members.map(renderMemberItem)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite</Text>
          <View style={styles.inviteContent}>
            <Text style={styles.joinCode}>Join Code: {group?.joinCode}</Text>
            <Button
              mode="outlined"
              onPress={onShare}
              icon="share-variant"
              labelStyle={{ color: colors.primary }}
            >
              Share
            </Button>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.error }]}>
            Danger Zone
          </Text>
          <Button
            mode="outlined"
            textColor={colors.error}
            onPress={onLeave}
            icon="logout"
            style={{ borderColor: colors.error, marginBottom: spacing.sm }}
          >
            Leave Group
          </Button>
          {isAdmin && (
            <Button
              mode="contained"
              buttonColor={colors.error}
              onPress={onDeleteGroup}
              icon="delete"
            >
              Delete Group
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  scrollContent: { padding: spacing.md },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.text,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  iconBtn: {
    padding: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  imageButton: {
    borderColor: colors.primary,
  },
  saveButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  memberDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberName: {
    ...typography.body,
    fontWeight: "bold",
  },
  memberRole: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inviteContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  joinCode: {
    ...typography.body,
    color: colors.text,
  },
});

export default GroupSettingsScreen;
