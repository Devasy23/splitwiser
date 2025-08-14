import { NavigationContainer } from '@react-navigation/native';
import { useContext } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { navTheme, navThemeDark } from '../utils/theme';
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

  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? navThemeDark : navTheme;
  return (
    <NavigationContainer theme={theme}>
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
