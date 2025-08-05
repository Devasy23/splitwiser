import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from 'react-native-paper';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import HomeScreen from '../screens/HomeScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';

const Stack = createNativeStackNavigator();

const GroupsStackNavigator = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen name="GroupsList" component={HomeScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default GroupsStackNavigator;
