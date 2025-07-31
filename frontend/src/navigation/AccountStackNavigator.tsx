import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from 'react-native-paper';

import AccountScreen from '@/screens/AccountScreen';

export type AccountStackParamList = {
  AccountMain: undefined;
};

const Stack = createNativeStackNavigator<AccountStackParamList>();

const AccountStackNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="AccountMain" 
        component={AccountScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AccountStackNavigator;
