import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay } from 'react-native-reanimated';
import { AuthContext } from '../context/AuthContext';
import { ThemeWrapper } from '../components/ThemeWrapper';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedButton } from '../components/ui/ThemedButton';
import { ThemedInput } from '../components/ui/ThemedInput';
import { useTheme } from '../context/ThemeContext';
import { THEMES, COLORS } from '../constants/theme';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useContext(AuthContext);
  const { style } = useTheme();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withSpring(0);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

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
    <ThemeWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.content, animatedStyle]}>
                <View style={styles.header}>
                    <ThemedText variant="headlineMedium">Create Account</ThemedText>
                    <ThemedText variant="body" style={{ marginTop: 8, opacity: 0.7 }}>Join the revolution of splitting bills.</ThemedText>
                </View>

                <View style={styles.form}>
                    <ThemedInput
                        label="Name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        placeholder="John Doe"
                    />
                    <ThemedInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="john@example.com"
                    />
                    <ThemedInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="••••••••"
                    />
                    <ThemedInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholder="••••••••"
                    />

                    <View style={{ height: 20 }} />

                    <ThemedButton
                        onPress={handleSignup}
                        loading={isLoading}
                    >
                        Sign Up
                    </ThemedButton>
                    <ThemedButton
                        onPress={() => navigation.navigate('Login')}
                        variant="outline"
                        disabled={isLoading}
                    >
                        Already have an account? Log In
                    </ThemedButton>
                </View>
            </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemeWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  header: {
      marginBottom: 32,
      alignItems: 'center',
  },
  form: {
      width: '100%',
  }
});

export default SignupScreen;
