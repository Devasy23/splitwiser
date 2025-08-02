import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user data from AsyncStorage on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('user_data');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load stored authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Save token to AsyncStorage whenever it changes
  useEffect(() => {
    const saveToken = async () => {
      try {
        if (token) {
          await AsyncStorage.setItem('auth_token', token);
        } else {
          await AsyncStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Failed to save token to storage:', error);
      }
    };

    saveToken();
  }, [token]);

  // Save user data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveUser = async () => {
      try {
        if (user) {
          await AsyncStorage.setItem('user_data', JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem('user_data');
        }
      } catch (error) {
        console.error('Failed to save user data to storage:', error);
      }
    };

    saveUser();
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const { access_token, user: userData } = response.data;
      setToken(access_token);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data?.detail || error.message);
      return false;
    }
  };

  const signup = async (name, email, password) => {
    try {
      await authApi.signup(name, email, password);
      return true;
    } catch (error) {
      console.error('Signup failed:', error.response?.data?.detail || error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clear stored authentication data
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    } catch (error) {
      console.error('Failed to clear stored authentication:', error);
    }
    
    setToken(null);
    setUser(null);
  };

  const updateUserInContext = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, updateUserInContext }}>
      {children}
    </AuthContext.Provider>
  );
};
