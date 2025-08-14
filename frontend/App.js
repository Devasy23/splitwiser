import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { paperTheme } from './utils/theme';

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <AppNavigator />
      </PaperProvider>
    </AuthProvider>
  );
}
