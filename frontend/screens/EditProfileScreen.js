import { useContext, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Appbar, Button, TextInput, Title } from "react-native-paper";
import { updateUser } from "../api/auth";
import { AuthContext } from "../context/AuthContext";

const EditProfileScreen = ({ navigation }) => {
  const { user, token, updateUserInContext } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await updateUser({ name });
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

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Profile" />
      </Appbar.Header>
      <View style={styles.content}>
        <Title>Edit Your Details</Title>
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={handleUpdateProfile}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.button}
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
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});

export default EditProfileScreen;
