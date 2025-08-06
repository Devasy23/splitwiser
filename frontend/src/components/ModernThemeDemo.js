import { StyleSheet, View } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../theme/useAppTheme';
import ModernButton from './ModernButton';
import ModernCard from './ModernCard';

/**
 * Demo component showcasing modern, minimal design with consistent styling
 * This component demonstrates the updated UI with reduced border radius and modern colors
 */
const ThemeDemo = () => {
  const { theme, getCardStyle, getModalStyle } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Modern UI Elements
      </Text>
      
      {/* Modern Card with subtle shadow */}
      <ModernCard variant="elevated" style={{ marginBottom: theme.custom.spacing.md }}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Modern Card Design</Text>
          <Text style={styles.cardText}>
            Clean design with subtle shadows and reduced border radius for a modern, minimal appearance.
          </Text>
        </Card.Content>
      </ModernCard>
      
      {/* Modern Input Field */}
      <TextInput
        label="Modern Input Field"
        placeholder="Consistent 8px border radius"
        style={styles.input}
        mode="outlined"
      />
      
      {/* Modern Buttons */}
      <ModernButton mode="contained" style={styles.button}>
        Primary Button
      </ModernButton>
      
      <ModernButton mode="outlined" style={styles.button}>
        Outlined Button
      </ModernButton>
      
      <ModernButton mode="text" style={styles.button}>
        Text Button
      </ModernButton>
      
      {/* Custom styled container with modern design */}
      <View style={[styles.modernSection, { 
        borderRadius: theme.custom.borderRadius,
        ...theme.custom.shadow.small 
      }]}>
        <Text variant="titleSmall" style={styles.sectionTitle}>Modern Section</Text>
        <Text style={styles.sectionText}>
          Subtle background with minimal shadows and clean typography for better readability.
        </Text>
      </View>

      {/* Color showcase */}
      <View style={styles.colorShowcase}>
        <Text variant="titleSmall" style={styles.sectionTitle}>Modern Color Palette</Text>
        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.colorLabel}>Primary Blue</Text>
        </View>
        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: theme.colors.surfaceVariant }]} />
          <Text style={styles.colorLabel}>Surface Variant</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa', // Light background
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  cardTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  cardText: {
    color: '#666',
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  modernSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  sectionText: {
    color: '#6b7280',
    lineHeight: 20,
  },
  colorShowcase: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  colorLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
});

export default ThemeDemo;
