import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay } from 'react-native-reanimated';
import { AuthContext } from '../context/AuthContext';
import { ThemeWrapper } from '../components/ThemeWrapper';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedButton } from '../components/ui/ThemedButton';
import { ThemedInput } from '../components/ui/ThemedInput';
import { useTheme } from '../context/ThemeContext';
import { THEMES, COLORS } from '../constants/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { style, mode } = useTheme();

  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const logoScale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    translateY.value = withSpring(0);
    logoScale.value = withDelay(300, withSpring(1));
  }, []);

  const animatedFormStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
        transform: [{ scale: logoScale.value }]
    };
  });

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
    <ThemeWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
            <Animated.View style={[styles.headerContainer, animatedLogoStyle]}>
                <View style={[
                    styles.logoCircle,
                    style === THEMES.NEOBRUTALISM ? {
                        borderWidth: 4,
                        borderColor: COLORS.neo.dark,
                        backgroundColor: COLORS.neo.main,
                        shadowColor: COLORS.neo.dark,
                        shadowOffset: { width: 6, height: 6 },
                        shadowOpacity: 1,
                        shadowRadius: 0,
                    } : {
                        backgroundColor: COLORS.neo.main,
                        shadowColor: COLORS.neo.main,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                    }
                ]}>
                    <ThemedText style={{ fontSize: 40, color: 'white' }} variant="headlineLarge">$</ThemedText>
                </View>
                <ThemedText variant="headlineMedium" style={{ marginTop: 20 }}>Welcome Back!</ThemedText>
                <ThemedText variant="body" style={{ marginTop: 8, opacity: 0.7 }}>Sign in to continue splitting.</ThemedText>
            </Animated.View>

            <Animated.View style={[styles.formContainer, animatedFormStyle]}>
                <ThemedInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="hello@example.com"
                />
                <ThemedInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="••••••••"
                />

                <View style={{ height: 20 }} />

                <ThemedButton
                    onPress={handleLogin}
                    loading={isLoading}
                >
                    Login
                </ThemedButton>

                <ThemedButton
                    onPress={() => navigation.navigate('Signup')}
                    variant="outline"
                >
                    Don't have an account? Sign Up
                </ThemedButton>
            </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </ThemeWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
      alignItems: 'center',
      marginBottom: 40,
  },
  logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
  },
  formContainer: {
      width: '100%',
  }
});

export default LoginScreen;
