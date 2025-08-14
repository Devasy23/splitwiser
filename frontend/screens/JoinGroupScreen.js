import { useContext, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Text, TextInput } from "react-native-paper";
import { joinGroup } from "../api/groups";
import { AuthContext } from "../context/AuthContext";
import { FadeInView, ScaleInView } from "../utils/animations";
import { GradientCard } from "../utils/gradients";
import { borderRadius, colors, shadows, spacing, typography } from "../utils/theme";

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
      Alert.alert("Success", "Successfully joined the group! 🎉");
      onGroupJoined(); // Call the callback to refresh the groups list
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
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction 
          onPress={() => navigation.goBack()} 
          iconColor={colors.primary}
        />
        <Appbar.Content 
          title="Join Group" 
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView delay={200}>
          <GradientCard 
            colors={colors.gradientSecondary} 
            style={styles.heroCard}
          >
            <Text style={styles.heroTitle}>Join a Group! 🚀</Text>
            <Text style={styles.heroSubtitle}>
              Enter the group code shared by your friends to start splitting expenses together
            </Text>
          </GradientCard>
        </FadeInView>

        <FadeInView delay={400} style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Group Join Code</Text>
            <TextInput
              value={joinCode}
              onChangeText={setJoinCode}
              style={styles.input}
              mode="outlined"
              autoCapitalize="characters"
              placeholder="e.g., TRIP2024"
              placeholderTextColor={colors.onSurfaceVariant}
              theme={{
                colors: {
                  primary: colors.primary,
                  outline: colors.outline,
                }
              }}
            />
            <Text style={styles.helpText}>
              💡 Ask your friend for the 6-8 character group code
            </Text>
          </View>

          <ScaleInView delay={600}>
            <Button
              mode="contained"
              onPress={handleJoinGroup}
              loading={isJoining}
              disabled={isJoining || !joinCode.trim()}
              style={[
                styles.joinButton,
                { opacity: joinCode.trim() ? 1 : 0.6 }
              ]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {isJoining ? "Joining..." : "Join Group"}
            </Button>
          </ScaleInView>

          <View style={styles.tipContainer}>
            <Text style={styles.tipTitle}>💡 How to get a group code?</Text>
            <Text style={styles.tipText}>
              • Ask the group creator to share the join code{'\n'}
              • Look for it in your group chat or invitation message{'\n'}
              • The code is usually 6-8 characters long
            </Text>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.onSurface,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  heroCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    ...typography.h2,
    color: 'white',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  heroSubtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    ...typography.label,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  helpText: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    ...typography.label,
    fontSize: 16,
    fontWeight: '700',
  },
  tipContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  tipTitle: {
    ...typography.h4,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  tipText: {
    ...typography.body2,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
});

export default JoinGroupScreen;
