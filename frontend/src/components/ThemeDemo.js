import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../src/theme/useAppTheme';

/**
 * Demo component showcasing consistent border radius across all UI elements
 * This component demonstrates how all elements now use the same border radius (12px)
 */
const ThemeDemo = () => {
  const { theme, getCardStyle, getModalStyle } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Consistent UI Elements
      </Text>
      
      {/* React Native Paper components automatically use theme.roundness */}
      <Card style={getCardStyle({ marginBottom: theme.custom.spacing.md })}>
        <Card.Content>
          <Text variant="titleMedium">Card Component</Text>
          <Text>This card uses the consistent border radius from the theme.</Text>
        </Card.Content>
      </Card>
      
      <TextInput
        label="Input Field"
        placeholder="This input has consistent border radius"
        style={styles.input}
      />
      
      <Button mode="contained" style={styles.button}>
        Button with Consistent Radius
      </Button>
      
      <Button mode="outlined" style={styles.button}>
        Outlined Button
      </Button>
      
      {/* Custom styled container using theme */}
      <View style={[styles.customContainer, { borderRadius: theme.custom.borderRadius }]}>
        <Text>Custom container with theme border radius</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  customContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default ThemeDemo;
