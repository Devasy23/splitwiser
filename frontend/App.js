import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { paperTheme, paperThemeDark } from './utils/theme';

export default function App() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? paperThemeDark : paperTheme;
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppNavigator />
        </GestureHandlerRootView>
      </PaperProvider>
    </AuthProvider>
  );
}
