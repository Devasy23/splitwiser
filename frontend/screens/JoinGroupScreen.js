import { useContext, useState } from "react";
import { Alert, StyleSheet, View, Text } from "react-native";
import { Appbar, Button, TextInput } from "react-native-paper";
import { joinGroup } from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { colors, spacing, typography } from "../styles/theme";

const JoinGroupScreen = ({ navigation, route }) => {
  const { token } = useContext(AuthContext);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const { onGroupJoined } = route.params;

  const handleJoinGroup = async () => {
    if (!joinCode) {
      Alert.alert("Error", "Please enter a join code.");
      return;
    }
    setIsJoining(true);
    try {
      await joinGroup(joinCode);
      Alert.alert("Success", "Successfully joined the group.");
      onGroupJoined();
      navigation.goBack();
    } catch (error) {
      console.error("Failed to join group:", error);
      Alert.alert(
        "Error",
        "Failed to join group. Please check the code and try again."
      );
    } finally {
      setIsJoining(false);
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
          title="Join a Group"
          color={colors.white}
          titleStyle={{ ...typography.h2 }}
        />
      </Appbar.Header>
      <View style={styles.content}>
        <Text style={styles.title}>Enter Group Code</Text>
        <TextInput
          label="Join Code"
          value={joinCode}
          onChangeText={setJoinCode}
          style={styles.input}
          autoCapitalize="characters"
          theme={{ colors: { primary: colors.accent } }}
        />
        <Button
          mode="contained"
          onPress={handleJoinGroup}
          loading={isJoining}
          disabled={isJoining}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          Join Group
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

export default JoinGroupScreen;
