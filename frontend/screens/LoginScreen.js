import React, { useContext, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import { 
  Button, 
  Text, 
  TextInput 
} from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, signInWithGoogle } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await login(email, password);
      
      if (!success) {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Success is handled by the context and navigation will be handled by your auth state changes
    } catch (error) {
      Alert.alert('Error', 'An error occurred during Google sign-in. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome Back
        </Text>
        
        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry={!showPassword}
            mode="outlined"
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading || isGoogleLoading}
          >
            Sign In
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            icon="google"
            mode="outlined"
            onPress={handleGoogleLogin}
            style={styles.googleButton}
            loading={isGoogleLoading}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </View>

        <View style={styles.signup}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 48,
    fontWeight: '600',
    color: '#2d3748',
  },
  form: {
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#6366f1',
    fontSize: 14,
  },
  button: {
    marginBottom: 24,
    paddingVertical: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
  },
  signup: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#64748b',
    fontSize: 16,
  },
  signupLink: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;