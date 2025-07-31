import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

const AddExpenseScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            Add Expense
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Placeholder for Add Expense screen.
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

export default AddExpenseScreen;
