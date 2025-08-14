import * as ImagePicker from "expo-image-picker";
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  Text,
  TextInput
} from "react-native-paper";
import {
  deleteGroup as apiDeleteGroup,
  leaveGroup as apiLeaveGroup,
  removeMember as apiRemoveMember,
  updateGroup as apiUpdateGroup,
  getGroupById,
  getGroupMembers,
  getOptimizedSettlements,
} from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { AnimatedCard, FadeInView, SlideInView } from "../utils/animations";
import { GradientCard, StatusGradient } from "../utils/gradients";
import { borderRadius, colors, shadows, spacing, typography } from "../utils/theme";

const ICON_CHOICES = ["👥", "🏠", "🎉", "🧳", "🍽️", "🚗", "🏖️", "🎮", "💼"];

const GroupSettingsScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { token, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [group, setGroup] = useState(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [pickedImage, setPickedImage] = useState(null); // { uri, base64 }

  const isAdmin = useMemo(() => {
    const me = members.find((m) => m.userId === user?._id);
    return me?.role === "admin";
  }, [members, user?._id]);

  const load = async () => {
    try {
      setLoading(true);
      const [gRes, mRes] = await Promise.all([
        getGroupById(groupId),
        getGroupMembers(groupId),
      ]);
      setGroup(gRes.data);
      setName(gRes.data.name);
      setIcon(gRes.data.imageUrl || gRes.data.icon || "");
      setMembers(mRes.data);
    } catch (e) {
      console.error("Failed to load group settings", e);
      Alert.alert("Error", "Failed to load group settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && groupId) load();
  }, [token, groupId]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Group Settings" });
  }, [navigation]);

  const onSave = async () => {
    if (!isAdmin) return;
    const updates = {};
    if (name && name !== group?.name) updates.name = name;

    // Handle different icon types
    if (pickedImage?.base64) {
      // If user picked an image, use it as imageUrl
      updates.imageUrl = `data:image/jpeg;base64,${pickedImage.base64}`;
    } else if (icon && icon !== (group?.imageUrl || group?.icon || "")) {
      // If user selected an emoji and it's different from current
      // Check if it's an emoji (not a URL)
      const isEmoji = ICON_CHOICES.includes(icon);
      if (isEmoji) {
        updates.imageUrl = icon; // Store emoji as imageUrl for now
      } else {
        updates.imageUrl = icon; // Store other text/URL as imageUrl
      }
    }

    if (Object.keys(updates).length === 0)
      return Alert.alert("Nothing to update");
    try {
      setSaving(true);
      const res = await apiUpdateGroup(groupId, updates);
      setGroup(res.data);
      if (pickedImage) setPickedImage(null);
      Alert.alert("Updated", "Group updated successfully.");
    } catch (e) {
      console.error("Update failed", e);
      Alert.alert(
        "Error",
        e.response?.data?.detail || "Failed to update group"
      );
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    if (!isAdmin) return;
    // Ask permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need media library permission to select an image."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPickedImage({ uri: asset.uri, base64: asset.base64 });
    }
  };

  const onShareInvite = async () => {
    try {
      const code = group?.joinCode;
      if (!code) return;
      await Share.share({
        message: `Join my group on Splitwiser! Use code ${code}`,
      });
    } catch (e) {
      console.error("Share failed", e);
    }
  };

  const onKick = (memberId, name) => {
    if (!isAdmin) return;
    if (memberId === user?._id) return; // safeguard
    Alert.alert("Remove member", `Are you sure you want to remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            // Pre-check balances using optimized settlements
            const settlementsRes = await getOptimizedSettlements(groupId);
            const settlements =
              settlementsRes?.data?.optimizedSettlements || [];
            const hasUnsettled = settlements.some(
              (s) =>
                (s.fromUserId === memberId || s.toUserId === memberId) &&
                (s.amount || 0) > 0
            );
            if (hasUnsettled) {
              Alert.alert(
                "Cannot remove",
                "This member has unsettled balances in the group."
              );
              return;
            }
            await apiRemoveMember(groupId, memberId);
            await load();
          } catch (e) {
            console.error("Remove failed", e);
            Alert.alert(
              "Error",
              e.response?.data?.detail || "Failed to remove member"
            );
          }
        },
      },
    ]);
  };

  const onLeave = () => {
    Alert.alert(
      "Leave group",
      "You can leave only when your balances are settled. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await apiLeaveGroup(groupId);
              Alert.alert("Left group");
              navigation.popToTop();
            } catch (e) {
              console.error("Leave failed", e);
              Alert.alert(
                "Cannot leave",
                e.response?.data?.detail || "Please settle balances first"
              );
            }
          },
        },
      ]
    );
  };

  const onDeleteGroup = () => {
    if (!isAdmin) return;
    // Only allow delete if no other members present
    const others = members.filter((m) => m.userId !== user?._id);
    if (others.length > 0) {
      Alert.alert(
        "Cannot delete",
        "Remove all members first, or transfer admin."
      );
      return;
    }
    Alert.alert(
      "Delete group",
      "This will permanently delete the group. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDeleteGroup(groupId);
              Alert.alert("Group deleted");
              navigation.popToTop();
            } catch (e) {
              console.error("Delete failed", e);
              Alert.alert(
                "Error",
                e.response?.data?.detail || "Failed to delete group"
              );
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = (m, index) => {
    const isSelf = m.userId === user?._id;
    const displayName = m.user?.name || "Unknown";
    const imageUrl = m.user?.imageUrl;
    
    return (
      <SlideInView key={m.userId} delay={index * 100}>
        <View style={styles.memberItem}>
          <View style={styles.memberInfo}>
            {imageUrl ? (
              <Avatar.Image size={48} source={{ uri: imageUrl }} style={styles.memberAvatar} />
            ) : (
              <Avatar.Text 
                size={48} 
                label={(displayName || "?").charAt(0)} 
                style={[styles.memberAvatar, { backgroundColor: colors.primary }]}
                labelStyle={{ color: 'white', fontWeight: '700' }}
              />
            )}
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>{displayName}</Text>
              {m.role === "admin" && (
                <Chip 
                  mode="outlined" 
                  style={styles.adminChip}
                  textStyle={styles.adminChipText}
                  icon="crown"
                >
                  Admin
                </Chip>
              )}
              {isSelf && (
                <Text style={styles.youLabel}>You</Text>
              )}
            </View>
          </View>
          {isAdmin && !isSelf && (
            <IconButton
              icon="account-remove"
              iconColor={colors.error}
              onPress={() => onKick(m.userId, displayName)}
              style={styles.removeButton}
            />
          )}
        </View>
        {index < members.length - 1 && <Divider style={styles.memberDivider} />}
      </SlideInView>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <FadeInView style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading group settings...</Text>
        </FadeInView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Info Section */}
        <FadeInView delay={100}>
          <GradientCard 
            colors={colors.gradientPrimary} 
            style={styles.headerCard}
          >
            <Text style={styles.headerTitle}>Group Settings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your group preferences and members
            </Text>
          </GradientCard>
        </FadeInView>

        {/* Basic Info Card */}
        <SlideInView delay={200}>
          <AnimatedCard style={styles.modernCard}>
            <Text style={styles.sectionTitle}>📝 Basic Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Group Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                editable={!!isAdmin}
                style={styles.modernInput}
                mode="outlined"
                theme={{
                  colors: {
                    primary: colors.primary,
                    outline: colors.outline,
                  }
                }}
              />
            </View>

            <View style={styles.iconSection}>
              <Text style={styles.inputLabel}>Choose an Icon</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.iconScrollView}
              >
                <View style={styles.iconRow}>
                  {ICON_CHOICES.map((i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.iconButton,
                        icon === i && styles.iconButtonSelected
                      ]}
                      onPress={() => setIcon(i)}
                      disabled={!isAdmin}
                    >
                      <Text style={styles.iconText}>{i}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.imageSection}>
              <Text style={styles.inputLabel}>Or Upload Custom Image</Text>
              <View style={styles.imageUploadContainer}>
                <Button
                  mode="outlined"
                  onPress={pickImage}
                  disabled={!isAdmin}
                  icon="image"
                  style={styles.uploadButton}
                  contentStyle={styles.uploadButtonContent}
                >
                  {pickedImage ? "Change Image" : "Upload Image"}
                </Button>
                {(pickedImage?.uri || (group?.imageUrl && /^(https?:|data:image)/.test(group.imageUrl))) && (
                  <View style={styles.currentImageContainer}>
                    <Image
                      source={{ 
                        uri: pickedImage?.uri || group?.imageUrl 
                      }}
                      style={styles.currentImage}
                    />
                    <Text style={styles.currentImageLabel}>Current</Text>
                  </View>
                )}
              </View>
            </View>

            {isAdmin && (
              <Button
                mode="contained"
                style={styles.saveButton}
                loading={saving}
                disabled={saving}
                onPress={onSave}
                contentStyle={styles.saveButtonContent}
              >
                Save Changes
              </Button>
            )}
          </AnimatedCard>
        </SlideInView>

        {/* Members Section */}
        <SlideInView delay={300}>
          <AnimatedCard style={styles.modernCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 Members</Text>
              <Chip 
                mode="outlined" 
                style={styles.memberCountChip}
                textStyle={styles.memberCountText}
              >
                {members.length} member{members.length !== 1 ? 's' : ''}
              </Chip>
            </View>
            
            <View style={styles.membersContainer}>
              {members.map((m, index) => renderMemberItem(m, index))}
            </View>
          </AnimatedCard>
        </SlideInView>

        {/* Invite Section */}
        <SlideInView delay={400}>
          <StatusGradient status="info" style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>🎉 Invite Friends</Text>
            <Text style={styles.inviteSubtitle}>
              Share this code with friends to join your group
            </Text>
            
            <View style={styles.joinCodeContainer}>
              <Text style={styles.joinCodeLabel}>Join Code</Text>
              <View style={styles.joinCodeBox}>
                <Text style={styles.joinCode}>{group?.joinCode}</Text>
              </View>
            </View>
            
            <Button
              mode="contained"
              onPress={onShareInvite}
              icon="share-variant"
              style={styles.shareButton}
              contentStyle={styles.shareButtonContent}
              buttonColor="rgba(255, 255, 255, 0.2)"
              textColor="white"
            >
              Share Invite
            </Button>
          </StatusGradient>
        </SlideInView>

        {/* Danger Zone */}
        <SlideInView delay={500}>
          <AnimatedCard style={[styles.modernCard, styles.dangerCard]}>
            <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
            <Text style={styles.dangerSubtitle}>
              These actions cannot be undone
            </Text>
            
            <View style={styles.dangerActions}>
              <Button
                mode="outlined"
                onPress={onLeave}
                icon="logout-variant"
                style={styles.leaveButton}
                textColor={colors.warning}
                theme={{
                  colors: {
                    outline: colors.warning,
                  }
                }}
              >
                Leave Group
              </Button>
              
              {isAdmin && (
                <Button
                  mode="contained"
                  buttonColor={colors.error}
                  onPress={onDeleteGroup}
                  icon="delete"
                  style={styles.deleteButton}
                  contentStyle={styles.deleteButtonContent}
                >
                  Delete Group
                </Button>
              )}
            </View>
          </AnimatedCard>
        </SlideInView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  scrollContent: { 
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: {
    ...typography.body1,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  headerCard: {
    marginBottom: spacing.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: 'white',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  modernCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.label,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  modernInput: {
    backgroundColor: colors.surface,
  },
  iconSection: {
    marginBottom: spacing.lg,
  },
  iconScrollView: {
    marginBottom: spacing.sm,
  },
  iconRow: { 
    flexDirection: "row", 
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 2,
    borderColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  iconText: {
    fontSize: 24,
  },
  imageSection: {
    marginBottom: spacing.lg,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  uploadButton: {
    borderColor: colors.outline,
  },
  uploadButtonContent: {
    paddingVertical: spacing.xs,
  },
  currentImageContainer: {
    alignItems: 'center',
  },
  currentImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.outline,
  },
  currentImageLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
  memberCountChip: {
    backgroundColor: colors.surfaceVariant,
  },
  memberCountText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  membersContainer: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    marginRight: spacing.md,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    ...typography.h4,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  adminChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  adminChipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  youLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  removeButton: {
    backgroundColor: colors.errorLight,
  },
  memberDivider: {
    backgroundColor: colors.outline,
    marginVertical: spacing.xs,
  },
  inviteCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  inviteTitle: {
    ...typography.h3,
    color: 'white',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  inviteSubtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  joinCodeContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  joinCodeLabel: {
    ...typography.label,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.sm,
  },
  joinCodeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  joinCode: {
    ...typography.h3,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 2,
  },
  shareButton: {
    borderRadius: borderRadius.md,
  },
  shareButtonContent: {
    paddingVertical: spacing.sm,
  },
  dangerCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  dangerTitle: {
    ...typography.h3,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  dangerSubtitle: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  dangerActions: {
    gap: spacing.md,
  },
  leaveButton: {
    borderColor: colors.warning,
  },
  deleteButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
  },
  deleteButtonContent: {
    paddingVertical: spacing.sm,
  },
});

export default GroupSettingsScreen;
