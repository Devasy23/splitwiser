import { AuthContext } from '@/context/AuthContext';
import { lightTheme } from '@/styles/theme';
import { elevation, spacing, typography } from '@/styles/variables';
import { validateEmail } from '@/utils/validation';
import React, { useContext, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    ActivityIndicator,
    Button,
    Surface,
    Text,
    TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useContext(AuthContext);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const success = await login(email.trim(), password);
      if (!success) {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupNavigation = () => {
    navigation.navigate('Signup');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Logo and App Name */}
            <Surface style={styles.logoContainer} elevation={elevation.level1}>
              <View style={styles.logoContent}>
                <Image
                  source={require('@/assets/icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text variant="headlineMedium" style={styles.appName}>
                  Splitwiser
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  Split expenses with friends
                </Text>
              </View>
            </Surface>

            {/* Login Form */}
            <Surface style={styles.formContainer} elevation={elevation.level2}>
              <Text variant="headlineSmall" style={styles.formTitle}>
                Welcome Back
              </Text>
              <Text variant="bodyMedium" style={styles.formSubtitle}>
                Sign in to your account
              </Text>

              <View style={styles.formContent}>
                {/* Email Input */}
                <TextInput
                  mode="outlined"
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  error={!!errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  left={<TextInput.Icon icon="email" />}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                />
                {errors.email && (
                  <Text variant="bodySmall" style={styles.errorText}>
                    {errors.email}
                  </Text>
                )}

                {/* Password Input */}
                <TextInput
                  mode="outlined"
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  error={!!errors.password}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.input}
                  contentStyle={styles.inputContent}
                />
                {errors.password && (
                  <Text variant="bodySmall" style={styles.errorText}>
                    {errors.password}
                  </Text>
                )}

                {/* Login Button */}
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  disabled={loading}
                  style={styles.loginButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={lightTheme.colors.onPrimary} />
                  ) : (
                    'Sign In'
                  )}
                </Button>

                {/* Forgot Password */}
                <Button
                  mode="text"
                  onPress={() => {
                    // TODO: Implement forgot password
                    Alert.alert('Coming Soon', 'Forgot password feature will be available soon.');
                  }}
                  style={styles.forgotButton}
                  labelStyle={styles.forgotButtonLabel}
                >
                  Forgot Password?
                </Button>
              </View>
            </Surface>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text variant="bodyMedium" style={styles.signupText}>
                Don't have an account?{' '}
              </Text>
              <Button
                mode="text"
                onPress={handleSignupNavigation}
                style={styles.signupButton}
                labelStyle={styles.signupButtonLabel}
              >
                Sign Up
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  logoContainer: {
    borderRadius: spacing.lg,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  logoContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    color: lightTheme.colors.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    color: lightTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: spacing.lg,
    padding: spacing.xl,
    backgroundColor: lightTheme.colors.surface,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
    color: lightTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  formSubtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: lightTheme.colors.onSurfaceVariant,
  },
  formContent: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: lightTheme.colors.surface,
  },
  inputContent: {
    fontSize: typography.bodyLarge.fontSize,
  },
  errorText: {
    color: lightTheme.colors.error,
    marginTop: -spacing.sm,
    marginLeft: spacing.sm,
  },
  loginButton: {
    marginTop: spacing.md,
    borderRadius: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    fontSize: typography.labelLarge.fontSize,
    fontWeight: typography.labelLarge.fontWeight,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  forgotButtonLabel: {
    color: lightTheme.colors.primary,
    fontSize: typography.bodyMedium.fontSize,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  signupText: {
    color: lightTheme.colors.onSurfaceVariant,
  },
  signupButton: {
    marginLeft: -spacing.sm,
  },
  signupButtonLabel: {
    color: lightTheme.colors.primary,
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
});

export default LoginScreen;
