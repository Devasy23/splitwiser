import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupSettingsScreen from '../screens/GroupSettingsScreen';
import HomeScreen from '../screens/HomeScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';
import ModernAddExpenseScreen from '../screens/ModernAddExpenseScreen';
import ModernGroupDetailsScreen from '../screens/ModernGroupDetailsScreen';

const Stack = createNativeStackNavigator();

const GroupsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GroupsList" component={HomeScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="GroupDetails" component={ModernGroupDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddExpense" component={ModernAddExpenseScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ title: 'Group Settings' }} />
    </Stack.Navigator>
  );
};

export default GroupsStackNavigator;
