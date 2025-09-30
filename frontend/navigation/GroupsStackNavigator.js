import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import GroupSettingsScreen from '../screens/GroupSettingsScreen';
import HomeScreen from '../screens/HomeScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';

const Stack = createNativeStackNavigator();

const GroupsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="GroupsList" component={HomeScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ headerShown: false }} />
  <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ title: 'Group Settings' }} />
    </Stack.Navigator>
  );
};

export default GroupsStackNavigator;
