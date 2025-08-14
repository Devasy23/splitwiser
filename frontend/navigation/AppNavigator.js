import { NavigationContainer } from '@react-navigation/native';
import { useContext } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { navTheme } from '../utils/theme';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const AppNavigator = () => {
  const { token, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {token ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})

export default AppNavigator;
