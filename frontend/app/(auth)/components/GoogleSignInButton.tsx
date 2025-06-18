import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Register for Google authentication
WebBrowser.maybeCompleteAuthSession();

const API_URL = 'https://splitwiser-production.up.railway.app';

// Replace with your own client IDs
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_EXPO_CLIENT_ID = 'YOUR_GOOGLE_EXPO_CLIENT_ID'; 

export default function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '323312632683-cgj2g17fgaucfclbsvm8gfgo3c2hohpf.apps.googleusercontent.com',
    iosClientId: '323312632683-dqv5ag5l03ms82q0lqs94uecetfrshnf.apps.googleusercontent.com',
    androidClientId: '323312632683-qj3n1dhq3gr18khd6dl5iamdh00qt6j3.apps.googleusercontent.com',
    webClientId: '323312632683-cgj2g17fgaucfclbsvm8gfgo3c2hohpf.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      setIsLoading(true);
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      // Send the token to your backend
      const response = await axios.post(`${API_URL}/auth/login/google`, {
        id_token: idToken
      });
      
      // Store the tokens securely
      await SecureStore.setItemAsync('access_token', response.data.access_token);
      await SecureStore.setItemAsync('refresh_token', response.data.refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Navigate to home page
      router.replace('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Google sign in failed. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.googleButton, isLoading && styles.buttonDisabled]} 
      onPress={() => promptAsync()}
      disabled={isLoading || !request}
    >
      <View style={styles.buttonContent}>
        <Image 
          source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>
          {isLoading ? 'Signing in...' : 'Sign in with Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#444',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});
