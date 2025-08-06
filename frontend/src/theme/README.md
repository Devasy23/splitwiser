# Theme System

This directory contains the theming system for consistent UI styling across the application.

## Files

- `theme.js` - Main theme configuration with consistent border radius and spacing
- `useAppTheme.js` - Custom hooks and utilities for theme-based styling

## Usage

### Basic Theme Usage

```javascript
import { useTheme } from 'react-native-paper';

const MyComponent = () => {
  const theme = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      borderRadius: theme.custom.borderRadius, // Consistent border radius (12px)
      padding: theme.custom.spacing.md, // Consistent spacing (16px)
    },
  });
  
  return <View style={styles.container}>...</View>;
};
```

### Using the Custom Hook

```javascript
import { useAppTheme } from '../src/theme/useAppTheme';

const MyComponent = () => {
  const { theme, getCardStyle, getModalStyle } = useAppTheme();
  
  return (
    <View style={getCardStyle({ marginBottom: 16 })}>
      <Modal contentContainerStyle={getModalStyle()}>
        ...
      </Modal>
    </View>
  );
};
```

### Creating Themed Styles

```javascript
import { useAppTheme, createThemedStyles } from '../src/theme/useAppTheme';

const createStyles = (theme) => StyleSheet.create({
  container: {
    borderRadius: theme.custom.borderRadius,
    padding: theme.custom.spacing.lg,
  },
});

const MyComponent = () => {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  
  return <View style={styles.container}>...</View>;
};
```

## Theme Properties

### Border Radius
- All components use a consistent border radius of **12px**
- Accessible via `theme.custom.borderRadius` or `theme.roundness` (for Paper components)

### Spacing
- `xs`: 4px
- `sm`: 8px  
- `md`: 16px
- `lg`: 24px
- `xl`: 32px

## Migration Notes

Components have been updated to use the theme system instead of hardcoded values:
- `HomeScreen.js` - Modal container uses theme border radius
- `GroupDetailsScreen.js` - Section containers use theme border radius  
- `FriendsScreen.js` - Explanation container uses theme border radius

All React Native Paper components (Button, TextInput, Card, etc.) automatically use the theme's `roundness` property.
