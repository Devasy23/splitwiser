import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import GroupSettingsScreen from '../screens/GroupSettingsScreen';
import HomeScreen from '../screens/HomeScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';
import SettleUpScreen from '../screens/SettleUpScreen';

const Stack = createNativeStackNavigator();

const GroupsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GroupsList" component={HomeScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SettleUp" component={SettleUpScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default GroupsStackNavigator;
