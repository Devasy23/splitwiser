import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { paperTheme } from './utils/theme';

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppNavigator />
        </GestureHandlerRootView>
      </PaperProvider>
    </AuthProvider>
  );
}
