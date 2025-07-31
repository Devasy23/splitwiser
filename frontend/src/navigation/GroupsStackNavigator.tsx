import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from 'react-native-paper';

import AddExpenseScreen from '@/screens/AddExpenseScreen';
import GroupDetailsScreen from '@/screens/GroupDetailsScreen';
import HomeScreen from '@/screens/HomeScreen';
import JoinGroupScreen from '@/screens/JoinGroupScreen';

export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetails: {
    groupId: string;
    groupName: string;
    groupIcon?: string;
  };
  AddExpense: {
    groupId: string;
  };
  JoinGroup: {
    inviteCode?: string;
  };
};

const Stack = createNativeStackNavigator<GroupsStackParamList>();

const GroupsStackNavigator: React.FC = () => {
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
        name="GroupsList" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GroupDetails" 
        component={GroupDetailsScreen}
        options={{ 
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="AddExpense" 
        component={AddExpenseScreen} 
        options={{ 
          title: 'Add Expense',
          headerBackTitleVisible: false,
        }} 
      />
      <Stack.Screen 
        name="JoinGroup" 
        component={JoinGroupScreen} 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack.Navigator>
  );
};

export default GroupsStackNavigator;
