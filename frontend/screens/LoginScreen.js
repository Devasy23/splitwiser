import React, { useContext, useState } from 'react';
import { Alert, ImageBackground, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

// A placeholder background image
const BACKGROUND_IMAGE = { uri: 'https://picsum.photos/id/20/800/1200' };

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    if (!success) {
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
    }
  };

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.formContainer}>
            <Text variant="headlineMedium" style={styles.title}>Welcome Back!</Text>
            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                theme={{ colors: { text: 'white', primary: 'white', placeholder: 'gray', background: 'transparent' } }}
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
                theme={{ colors: { text: 'white', primary: 'white', placeholder: 'gray', background: 'transparent' } }}
            />
            <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                loading={isLoading}
                disabled={isLoading}
            >
                Login
            </Button>
            <Button
                onPress={() => navigation.navigate('Signup')}
                style={styles.button}
                labelStyle={styles.buttonLabel}
                textColor='white'
            >
                Don't have an account? Sign Up
            </Button>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  formContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  button: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default LoginScreen;
