import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

const SignupScreen = ({ navigation }) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useContext(AuthContext);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', "Passwords don't match!");
      return;
    }
    setIsLoading(true);
    const success = await signup(name, email, password);
    setIsLoading(false);
    if (success) {
      Alert.alert(
        'Success',
        'Your account has been created successfully. Please log in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Signup Failed', 'An error occurred. Please try again.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
      backgroundColor: theme.colors.background,
    },
    title: {
      textAlign: 'center',
      marginBottom: 24,
      color: theme.colors.primary,
    },
    input: {
      marginBottom: 16,
    },
    button: {
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        autoCapitalize="words"
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        secureTextEntry
      />
      <Button
        mode="contained"
        onPress={handleSignup}
        style={styles.button}
        loading={isLoading}
        disabled={isLoading}
      >
        Sign Up
      </Button>
      <Button onPress={() => navigation.navigate('Login')} style={styles.button} disabled={isLoading}>
        Already have an account? Log In
      </Button>
    </View>
  );
};

export default SignupScreen;
