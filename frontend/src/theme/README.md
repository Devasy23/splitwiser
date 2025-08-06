# Modern Theme System

This directory contains a modern, minimal theming system for consistent UI styling across the application.

## Design Philosophy

- **Minimal & Clean**: Reduced border radius (8px) for a modern, subtle appearance
- **Consistent Spacing**: Standardized spacing scale for visual harmony
- **Subtle Shadows**: Light shadows for depth without overwhelming the interface
- **Modern Colors**: Updated color palette with better contrast and accessibility

## Files

- `theme.js` - Main theme configuration with modern design tokens
- `useAppTheme.js` - Custom hooks and utilities for theme-based styling
- `../components/ModernCard.js` - Modern card component with consistent styling
- `../components/ModernButton.js` - Modern button component

## Usage

### Basic Theme Usage

```javascript
import { useTheme } from 'react-native-paper';

const MyComponent = () => {
  const theme = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      borderRadius: theme.custom.borderRadius, // Modern border radius (8px)
      padding: theme.custom.spacing.md, // Consistent spacing (16px)
      ...theme.custom.shadow.small, // Subtle shadow
    },
  });
  
  return <View style={styles.container}>...</View>;
};
```

### Using Modern Components

```javascript
import ModernCard from '../src/components/ModernCard';
import ModernButton from '../src/components/ModernButton';

const MyComponent = () => {
  return (
    <ModernCard variant="elevated">
      <ModernCard.Content>
        <Text>Modern card with subtle shadow</Text>
        <ModernButton mode="contained">
          Modern Button
        </ModernButton>
      </ModernCard.Content>
    </ModernCard>
  );
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

## Design Tokens

### Border Radius
- **Primary**: 8px - Used for most UI elements (buttons, cards, inputs)
- **Small**: 6px - Used for smaller elements like chips and badges  
- **Large**: 12px - Used for modals and major containers only

### Spacing Scale
- `xs`: 4px - Minimal spacing
- `sm`: 8px - Small spacing
- `md`: 16px - Standard spacing (most common)
- `lg`: 24px - Large spacing
- `xl`: 32px - Extra large spacing

### Shadows
- **Small**: Subtle shadow for cards and elevated elements
- **Medium**: Deeper shadow for modals and floating elements

### Modern Color Updates
- **Surface**: Clean white backgrounds
- **Surface Variant**: Light gray for subtle contrast
- **Primary**: iOS-style blue (#007AFF) for modern appeal
- **Outline**: Subtle borders (#e1e1e6)

## Migration from Previous Design

### Changes Made:
- Reduced border radius from 12px to 8px for a more modern look
- Updated color palette with subtler backgrounds
- Reduced border widths from 4px to 3px for accent lines
- Added subtle shadow system for depth
- Created reusable modern components

### Updated Screens:
- `HomeScreen.js` - Modern modal styling with larger radius for containers
- `GroupDetailsScreen.js` - Subtle section backgrounds with modern shadows
- `FriendsScreen.js` - Updated explanation container with modern colors

All React Native Paper components automatically use the theme's `roundness` property (8px).
