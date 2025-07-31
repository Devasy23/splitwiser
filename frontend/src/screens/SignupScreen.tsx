import { AuthContext } from '@/context/AuthContext';
import { borderRadius, elevation, spacing } from '@/styles/variables';
import { validateEmail, validatePhone } from '@/utils/validation';
import React, { useContext, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Divider,
    Surface,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';

interface SignupScreenProps {
  navigation: any;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { signup } = useContext(AuthContext);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setPhoneError('');

    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    // Validate phone (optional)
    if (phone.trim() && !validatePhone(phone)) {
      setPhoneError('Please enter a valid phone number');
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    const success = await signup(name.trim(), email.trim(), password);
    if (success) {
      Alert.alert(
        'Account Created',
        'Your account has been created successfully. Please sign in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } else {
      Alert.alert(
        'Signup Failed',
        'An error occurred while creating your account. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLoginNavigation = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.keyboardContainer, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Surface style={[styles.logoContainer, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
            <Text variant="displaySmall" style={[styles.logoText, { color: theme.colors.onPrimaryContainer }]}>
              💰
            </Text>
            <Text variant="headlineMedium" style={[styles.appName, { color: theme.colors.onPrimaryContainer }]}>
              Join Splitwiser
            </Text>
            <Text variant="bodyMedium" style={[styles.tagline, { color: theme.colors.onPrimaryContainer }]}>
              Create your account to get started
            </Text>
          </Surface>

          <Card style={[styles.signupCard, { backgroundColor: theme.colors.surface }]} mode="elevated">
            <Card.Content style={styles.cardContent}>
              <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                Create Account
              </Text>

              <View style={styles.formContainer}>
                <TextInput
                  label="Full Name"
                  value={name}
                  onChangeText={(text: string) => {
                    setName(text);
                    if (nameError) setNameError('');
                  }}
                  mode="outlined"
                  autoCapitalize="words"
                  autoComplete="name"
                  error={!!nameError}
                  style={styles.input}
                  left={<TextInput.Icon icon="account" />}
                />
                {nameError ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {nameError}
                  </Text>
                ) : null}

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={(text: string) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!emailError}
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                />
                {emailError ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {emailError}
                  </Text>
                ) : null}

                <TextInput
                  label="Phone (Optional)"
                  value={phone}
                  onChangeText={(text: string) => {
                    setPhone(text);
                    if (phoneError) setPhoneError('');
                  }}
                  mode="outlined"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  error={!!phoneError}
                  style={styles.input}
                  left={<TextInput.Icon icon="phone" />}
                />
                {phoneError ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {phoneError}
                  </Text>
                ) : null}

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={(text: string) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  error={!!passwordError}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon 
                      icon={showPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
                {passwordError ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {passwordError}
                  </Text>
                ) : null}

                <TextInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(text: string) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  mode="outlined"
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  error={!!confirmPasswordError}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon 
                      icon={showConfirmPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />
                {confirmPasswordError ? (
                  <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                    {confirmPasswordError}
                  </Text>
                ) : null}
              </View>

              <Button
                mode="contained"
                onPress={handleSignup}
                disabled={loading}
                style={styles.signupButton}
                contentStyle={styles.buttonContent}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  'Create Account'
                )}
              </Button>

              <Divider style={styles.divider} />

              <View style={styles.loginContainer}>
                <Text variant="bodyMedium" style={[styles.loginText, { color: theme.colors.onSurfaceVariant }]}>
                  Already have an account?
                </Text>
                <Button
                  mode="text"
                  onPress={handleLoginNavigation}
                  disabled={loading}
                  compact
                >
                  Sign In
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    ...elevation.level2,
  },
  logoText: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  tagline: {
    opacity: 0.8,
    textAlign: 'center',
  },
  signupCard: {
    ...elevation.level3,
    marginBottom: spacing.xl,
  },
  cardContent: {
    paddingVertical: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  signupButton: {
    marginBottom: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  divider: {
    marginVertical: spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    marginRight: spacing.xs,
  },
});

export default SignupScreen;
