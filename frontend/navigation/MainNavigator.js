import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import GroupsStackNavigator from './GroupsStackNavigator';
import FriendsScreen from '../screens/FriendsScreen';
import AccountStackNavigator from './AccountStackNavigator';
import { colors, spacing, typography } from '../styles/theme';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Groups"
        component={GroupsStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
              <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} color={focused ? colors.brandAccent : colors.textSecondary} size={24} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>Dashboard</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
              <Ionicons name={focused ? "people" : "people-outline"} color={focused ? colors.brandAccent : colors.textSecondary} size={24} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>Friends</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
              <Ionicons name={focused ? "person-circle" : "person-circle-outline"} color={focused ? colors.brandAccent : colors.textSecondary} size={24} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>Account</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        elevation: 0,
        backgroundColor: colors.neutral.white,
        borderRadius: 15,
        height: 90,
        borderTopWidth: 0,
        shadowColor: colors.neutral.black,
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        top: 10,
        padding: spacing.sm,
        borderRadius: 15,
    },
    tabItemFocused: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    tabLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 12,
    },
    tabLabelFocused: {
        ...typography.caption,
        color: colors.brandAccent,
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default MainNavigator;
