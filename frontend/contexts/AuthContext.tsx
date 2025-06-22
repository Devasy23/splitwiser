import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

const API_URL = 'https://splitwiser-production.up.railway.app'; // Replace with your actual backend URL

// Define the shape of our authentication context
type AuthContextType = {
  isAuthenticated: boolean;
  user: any;
  accessToken: string | null;
  refreshToken: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (userData: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Logout function defined before useEffect to avoid reference errors
  const logout = async () => {
    // Clear auth state
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear secure storage
    await SecureStore.deleteItemAsync('refreshToken');
  };

  // Helper function to handle authentication success
  const handleAuthSuccess = async (responseData: any) => {
    setAccessToken(responseData.access_token);
    setRefreshToken(responseData.refresh_token);
    setUser(responseData.user);
    setIsAuthenticated(true);
    
    // Save refresh token securely
    await SecureStore.setItemAsync('refreshToken', responseData.refresh_token);
  };

  // Set up axios with interceptors for authentication
  useEffect(() => {
    // Configure axios defaults
    axios.defaults.baseURL = API_URL;

    // Set up request interceptor and store the ID
    const requestInterceptorId = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Set up response interceptor for token refresh and store the ID
    const responseInterceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If 401 response and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;

          try {
            // Call refresh token endpoint
            const response = await axios.post('/auth/refresh', { refresh_token: refreshToken });
            
            // Update tokens
            setAccessToken(response.data.access_token);
            if (response.data.refresh_token) {
              setRefreshToken(response.data.refresh_token);
              await SecureStore.setItemAsync('refreshToken', response.data.refresh_token);
            }

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh fails, log out the user
            console.error('Token refresh failed:', refreshError);
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Check for existing session on app load
    const loadTokens = async () => {
      try {
        // Get refresh token from secure storage
        const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');
        
        if (storedRefreshToken) {
          // Try to get a new access token
          const response = await axios.post('/auth/refresh', { refresh_token: storedRefreshToken });
          
          // Set authentication state
          setAccessToken(response.data.access_token);
          setRefreshToken(response.data.refresh_token || storedRefreshToken);
          setUser(response.data.user);
          setIsAuthenticated(true);
          
          // Update storage if we got a new refresh token
          if (response.data.refresh_token) {
            await SecureStore.setItemAsync('refreshToken', response.data.refresh_token);
          }
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
        // Clear any invalid tokens
        await SecureStore.deleteItemAsync('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    loadTokens();

    // Cleanup function to remove interceptors
    return () => {
      axios.interceptors.request.eject(requestInterceptorId);
      axios.interceptors.response.eject(responseInterceptorId);
    };
  }, [accessToken, refreshToken, logout, setAccessToken, setRefreshToken, setUser, setIsAuthenticated, setLoading]);

  // Email/Password login
  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/login/email', credentials);
      await handleAuthSuccess(response.data);
    } finally {
      setLoading(false);
    }
  };

  // Email/Password signup
  const signup = async (userData: { email: string; password: string; name: string }) => {
    setLoading(true);
    try {
      const response = await axios.post('/auth/signup/email', userData);
      await handleAuthSuccess(response.data);
    } finally {
      setLoading(false);
    }
  };

  // Provide auth context to children
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        refreshToken,
        login,
        signup,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
