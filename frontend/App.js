import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { CombinedDarkTheme, CombinedDefaultTheme, PreferencesContext } from './styles/theme';

export default function App() {
  const colorScheme = useColorScheme();
  const [isThemeDark, setIsThemeDark] = React.useState(colorScheme === 'dark');

  let theme = isThemeDark ? CombinedDarkTheme : CombinedDefaultTheme;

  const toggleTheme = React.useCallback(() => {
    return setIsThemeDark(!isThemeDark);
  }, [isThemeDark]);

  const preferences = React.useMemo(
    () => ({
      toggleTheme,
      isThemeDark,
    }),
    [toggleTheme, isThemeDark]
  );

  return (
    <PreferencesContext.Provider value={preferences}>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer theme={theme}>
            <AppNavigator />
          </NavigationContainer>
        </PaperProvider>
      </AuthProvider>
    </PreferencesContext.Provider>
  );
}
