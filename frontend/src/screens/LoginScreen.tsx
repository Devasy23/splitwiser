import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

const LoginScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            Login
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Material 3 Design Implementation
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            This is a placeholder for the Login screen.
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
  subtitle: {
    marginBottom: 8,
    opacity: 0.7,
  },
  description: {
    opacity: 0.6,
  },
});

export default LoginScreen;
