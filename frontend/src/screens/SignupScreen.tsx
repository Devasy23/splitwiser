import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

const SignupScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            Sign Up
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Placeholder for Sign Up screen.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    opacity: 0.6,
  },
});

export default SignupScreen;
