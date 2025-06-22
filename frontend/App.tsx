import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createNativeStackNavigator();

/**
 * Renders the navigation stack based on authentication status.
 *
 * Displays the Home screen if the user is authenticated, or the Login screen if not.
 */
function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Splitwiser' }} 
        />
      ) : (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
      )}
    </Stack.Navigator>
  );
}

/**
 * The main entry point of the React Native app, providing authentication context and navigation.
 *
 * Wraps the application in an authentication provider and navigation container, rendering the appropriate screens based on authentication state.
 */
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}
