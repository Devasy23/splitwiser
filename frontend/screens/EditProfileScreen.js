import * as ImagePicker from "expo-image-picker";
import { useContext, useState } from "react";
import { Alert, StyleSheet, View, Text } from "react-native";
import { Appbar, Avatar, Button, TextInput } from "react-native-paper";
import { updateUser } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUserInContext } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || "");
  const [pickedImage, setPickedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      const updates = { name };
      if (pickedImage?.base64) {
        const mime = pickedImage.mimeType || "image/jpeg";
        updates.imageUrl = `data:${mime};base64,${pickedImage.base64}`;
      }
      const response = await updateUser(updates);
      updateUserInContext(response.data);
      Alert.alert("Success", "Profile updated successfully.");
      navigation.goBack();
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickImage = async () => {
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
      let mimeType = asset.mimeType || "image/jpeg";
      setPickedImage({ uri: asset.uri, base64: asset.base64, mimeType });
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: colors.primary }}>
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={colors.white}
        />
        <Appbar.Content
          title="Edit Profile"
          color={colors.white}
          titleStyle={{ ...typography.h2 }}
        />
      </Appbar.Header>
      <View style={styles.content}>
        <Text style={styles.title}>Edit Your Details</Text>

        <View style={styles.profilePictureSection}>
          <Avatar.Image
            size={120}
            source={{
              uri:
                pickedImage?.uri ||
                (user?.imageUrl && /^(https?:|data:image)/.test(user.imageUrl)
                  ? user.imageUrl
                  : `https://avatar.iran.liara.run/username?username=${
                      user?.name || "A"
                    }`),
            }}
            style={styles.avatar}
          />
          <Button
            mode="text"
            onPress={pickImage}
            icon="camera"
            style={styles.imageButton}
            labelStyle={styles.imageButtonLabel}
          >
            {pickedImage ? "Change Photo" : "Add Photo"}
          </Button>
        </View>

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          theme={{ colors: { primary: colors.accent } }}
        />
        <Button
          mode="contained"
          onPress={handleUpdateProfile}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Save Changes
        </Button>
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
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  profilePictureSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  imageButton: {
    marginTop: spacing.md,
  },
  imageButtonLabel: {
    color: colors.primary,
  },
  input: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: "bold",
  },
});

export default EditProfileScreen;
