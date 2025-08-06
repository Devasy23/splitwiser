# Migration to Material 3 with Dynamic Theming

This document outlines the changes made to the application to migrate from a static theme to a Material 3 design with dynamic theming (Material You).

## 1. Project Structure Changes

A new directory `styles` was created to house the theming logic.

- `styles/theme.js`: This file contains the core logic for enabling dynamic theming.

## 2. Key Changes by Folder

### `/` (Root Directory)

- **`App.js`**:
  - The `PaperProvider` is now wrapped in a new `Main` component.
  - The `Main` component uses the `useAppTheme` hook from `styles/theme.js` to get the dynamic theme and applies it to the `PaperProvider`. This enables app-wide dynamic theming.

### `styles/`

- **`theme.js`**:
  - This new file exports a `useAppTheme` hook.
  - It uses the `@pchmn/expo-material3-theme` library to get the Material 3 theme based on the user's system colors on Android 12+.
  - It provides a fallback to the default light theme for other platforms or older Android versions.

### `screens/`

All screens in this folder have been refactored to use the dynamic theme. The general changes for each screen are:

- **Import `useTheme`**: The `useTheme` hook from `react-native-paper` is imported.
- **Get Theme Object**: The theme object is retrieved using `const theme = useTheme();`.
- **Dynamic Styles**: Hardcoded colors in `StyleSheet` have been replaced with colors from the theme object (e.g., `theme.colors.primary`, `theme.colors.background`, `theme.colors.onSurface`).
- **Removed `StyleSheet.create` from component body**: The `StyleSheet.create` call was moved outside the component body to avoid re-creating the styles on every render. The styles that depend on the theme are created inside the component.

**Example of changes in a screen (`HomeScreen.js`):**

- Hardcoded colors like `'#4CAF50'` and `'white'` were replaced with `theme.colors.primary` and `theme.colors.background`.
- The main view's background color is now set to `theme.colors.background`.
- Text colors are now set to `theme.colors.onSurface` or `theme.colors.onSurfaceVariant` for better readability on different backgrounds.

### `navigation/`

- **`MainNavigator.js`**:
  - The bottom tab navigator now uses the dynamic theme.
  - `tabBarActiveTintColor` is set to `theme.colors.primary`.
  - `tabBarInactiveTintColor` is set to `theme.colors.onSurfaceVariant`.
  - `tabBarStyle`'s `backgroundColor` is set to `theme.colors.surface`.

- **`GroupsStackNavigator.js`**:
  - The stack navigator's header is now themed.
  - `headerStyle`'s `backgroundColor` is set to `theme.colors.surface`.
  - `headerTintColor` is set to `theme.colors.onSurface`.

- **`AuthNavigator.js` & `AccountStackNavigator.js`**:
  - No changes were needed as these navigators either hide the header or the screens they render already use themed components (`Appbar`).

## 3. New Dependency

- **`@pchmn/expo-material3-theme`**: This library was added to fetch the system's color palette on Android to enable Material You dynamic theming.

These changes ensure that the app has a modern, minimal UI that adapts to the user's device theme, providing a more personalized experience.
