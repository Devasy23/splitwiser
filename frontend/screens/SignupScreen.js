import React, { useContext, useState } from 'react';
import { Alert, ImageBackground, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

// A placeholder background image
const BACKGROUND_IMAGE = { uri: 'https://picsum.photos/id/30/800/1200' };

const SignupScreen = ({ navigation }) => {
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

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.container}>
        <View style={styles.overlay}>
            <View style={styles.formContainer}>
                <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
                <TextInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    autoCapitalize="words"
                    theme={{ colors: { text: 'white', primary: 'white', placeholder: 'gray', background: 'transparent' } }}
                />
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
                <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                    secureTextEntry
                    theme={{ colors: { text: 'white', primary: 'white', placeholder: 'gray', background: 'transparent' } }}
                />
                <Button
                    mode="contained"
                    onPress={handleSignup}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    loading={isLoading}
                    disabled={isLoading}
                >
                    Sign Up
                </Button>
                <Button
                    onPress={() => navigation.navigate('Login')}
                    style={styles.button}
                    labelStyle={styles.buttonLabel}
                    textColor='white'
                    disabled={isLoading}
                >
                    Already have an account? Log In
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

export default SignupScreen;
