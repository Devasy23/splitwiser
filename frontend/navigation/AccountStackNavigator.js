import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccountScreen from '../screens/AccountScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

const AccountStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AccountRoot" component={AccountScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AccountStackNavigator;
