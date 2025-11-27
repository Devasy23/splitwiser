import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GroupsStackNavigator from './GroupsStackNavigator';
import FriendsScreen from '../screens/FriendsScreen';
import AccountStackNavigator from './AccountStackNavigator';
import { useTheme } from '../context/ThemeContext';
import { COLORS, THEMES } from '../constants/theme';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const { style, mode } = useTheme();

  const tabBarStyles = style === THEMES.NEOBRUTALISM ? {
      backgroundColor: mode === 'dark' ? COLORS.neo.dark : COLORS.neo.white,
      borderTopWidth: 3,
      borderTopColor: COLORS.neo.dark,
      height: 60,
      paddingBottom: 8,
  } : {
      backgroundColor: mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderTopWidth: 0,
      elevation: 0,
      height: 60,
  };

  const activeColor = style === THEMES.NEOBRUTALISM ? COLORS.neo.main : COLORS.neo.accent;
  const inactiveColor = mode === 'dark' ? '#888' : '#666';

  return (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: tabBarStyles,
            tabBarActiveTintColor: activeColor,
            tabBarInactiveTintColor: inactiveColor,
            tabBarLabelStyle: {
                fontFamily: 'SpaceGrotesk_700Bold',
                fontSize: 12,
            }
        }}
    >
      <Tab.Screen
        name="Groups"
        component={GroupsStackNavigator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && style === THEMES.NEOBRUTALISM ? {
                transform: [{ translateY: -2 }],
                borderBottomWidth: 2,
                borderBottomColor: color,
                paddingBottom: 2
            } : {}}>
                <MaterialCommunityIcons name="account-group" color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
             <View style={focused && style === THEMES.NEOBRUTALISM ? {
                transform: [{ translateY: -2 }],
                borderBottomWidth: 2,
                borderBottomColor: color,
                paddingBottom: 2
            } : {}}>
                <MaterialCommunityIcons name="account-multiple" color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStackNavigator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
             <View style={focused && style === THEMES.NEOBRUTALISM ? {
                transform: [{ translateY: -2 }],
                borderBottomWidth: 2,
                borderBottomColor: color,
                paddingBottom: 2
            } : {}}>
                <MaterialCommunityIcons name="account-cog" color={color} size={size} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
