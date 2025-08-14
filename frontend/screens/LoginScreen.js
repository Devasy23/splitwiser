import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, typography } from '../styles/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useContext(AuthContext);

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Google Sign-In Failed', 'An error occurred during Google Sign-In. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        theme={{ colors: { primary: colors.accent } }}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
        theme={{ colors: { primary: colors.accent } }}
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
        mode="contained"
        onPress={handleGoogleSignIn}
        style={[styles.button, styles.googleButton]}
        labelStyle={styles.buttonLabel}
        icon="google"
        disabled={isLoading}
      >
        Sign in with Google
      </Button>
      <Button
        onPress={() => navigation.navigate('Signup')}
        style={styles.signupButton}
        labelStyle={styles.signupButtonLabel}
      >
        Don't have an account? Sign Up
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.secondary,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  googleButton: {
    backgroundColor: '#4285F4', // Google's brand color
  },
  buttonLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
  },
  signupButton: {
    marginTop: spacing.md,
  },
  signupButtonLabel: {
    color: colors.primary,
  },
});

export default LoginScreen;
