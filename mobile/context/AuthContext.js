import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as authApi from "../api/auth";
import {
  clearAuthTokens,
  setAuthTokens,
  setTokenUpdateListener,
} from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refresh, setRefresh] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Biometric states
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [lastPassword, setLastPassword] = useState(null);

  // Load token and user data from AsyncStorage on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        const storedRefresh = await AsyncStorage.getItem("refresh_token");
  const storedUser = await AsyncStorage.getItem("user_data");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setRefresh(storedRefresh);
          await setAuthTokens({
            newAccessToken: storedToken,
            newRefreshToken: storedRefresh,
          });
          // Normalize user id shape: ensure `_id` exists even if API stored `id`
          const parsed = JSON.parse(storedUser);
          const normalized = parsed?._id
            ? parsed
            : parsed?.id
            ? { ...parsed, _id: parsed.id }
            : parsed;
          setUser(normalized);
        }
      } catch (error) {
        console.error("Failed to load stored authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadBiometricStatus = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          setIsBiometricSupported(true);
          const enabled = await SecureStore.getItemAsync('biometric_enabled');
          setIsBiometricEnabled(enabled === 'true');
        }
      } catch (error) {
        console.error("Failed to load biometric status:", error);
      }
    };

    loadStoredAuth();
    loadBiometricStatus();
  }, []);

  // Subscribe to token updates from the api client (refresh flow)
  useEffect(() => {
    setTokenUpdateListener(async ({ accessToken, refreshToken }) => {
      if (accessToken && accessToken !== token) setToken(accessToken);
      if (refreshToken && refreshToken !== refresh) setRefresh(refreshToken);
    });
  }, [token, refresh]);

  // Save tokens to AsyncStorage whenever they change
  useEffect(() => {
    const saveToken = async () => {
      try {
        if (token) {
          await AsyncStorage.setItem("auth_token", token);
        } else {
          await AsyncStorage.removeItem("auth_token");
        }
      } catch (error) {
        console.error("Failed to save token to storage:", error);
      }
    };

    saveToken();
  }, [token]);

  useEffect(() => {
    const saveRefresh = async () => {
      try {
        if (refresh) {
          await AsyncStorage.setItem("refresh_token", refresh);
        } else {
          await AsyncStorage.removeItem("refresh_token");
        }
      } catch (error) {
        console.error("Failed to save refresh token to storage:", error);
      }
    };
    saveRefresh();
  }, [refresh]);

  const enableBiometrics = async (email, password) => {
    try {
      if (!user) return;
      await SecureStore.setItemAsync('biometric_email', email);
      await SecureStore.setItemAsync('biometric_password', password);
      await SecureStore.setItemAsync('biometric_userId', user._id || user.id);
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      setIsBiometricEnabled(true);
    } catch (error) {
      console.error("Failed to enable biometrics:", error);
    }
  };

  const disableBiometrics = async () => {
    try {
      await SecureStore.deleteItemAsync('biometric_email');
      await SecureStore.deleteItemAsync('biometric_password');
      await SecureStore.deleteItemAsync('biometric_userId');
      await SecureStore.deleteItemAsync('biometric_enabled');
      setIsBiometricEnabled(false);
    } catch (error) {
      console.error("Failed to disable biometrics:", error);
    }
  };

  const loginWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to Splitwiser',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const storedEmail = await SecureStore.getItemAsync('biometric_email');
        const storedPassword = await SecureStore.getItemAsync('biometric_password');

        if (storedEmail && storedPassword) {
          return await login(storedEmail, storedPassword);
        }
      }
      return false;
    } catch (error) {
      console.error("Biometric login failed:", error);
      return false;
    }
  };

  // Save user data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveUser = async () => {
      try {
        if (user) {
          await AsyncStorage.setItem("user_data", JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem("user_data");
        }
      } catch (error) {
        console.error("Failed to save user data to storage:", error);
      }
    };

    saveUser();
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const { access_token, refresh_token, user: userData } = response.data;
      setToken(access_token);
      setRefresh(refresh_token);
      await setAuthTokens({
        newAccessToken: access_token,
        newRefreshToken: refresh_token,
      });
      // Normalize user id shape: ensure `_id` exists even if backend returns `id`
      const normalizedUser = userData?._id
        ? userData
        : userData?.id
        ? { ...userData, _id: userData.id }
        : userData;
      setUser(normalizedUser);
      setLastPassword(password);

      const storedBiometricUserId = await SecureStore.getItemAsync('biometric_userId');
      if (storedBiometricUserId && storedBiometricUserId !== normalizedUser._id) {
        await disableBiometrics();
      }

      return true;
    } catch (error) {
      console.error(
        "Login failed:",
        error.response?.data?.detail || error.message
      );
      return false;
    }
  };

  const signup = async (name, email, password) => {
    try {
      await authApi.signup(name, email, password);
      setLastPassword(password);
      return true;
    } catch (error) {
      console.error(
        "Signup failed:",
        error.response?.data?.detail || error.message
      );
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clear stored authentication data
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("refresh_token");
      await AsyncStorage.removeItem("user_data");
    } catch (error) {
      console.error("Failed to clear stored authentication:", error);
    }

    setToken(null);
    setRefresh(null);
    setUser(null);
    setLastPassword(null);
    await clearAuthTokens();
  };

  const updateUserInContext = (updatedUser) => {
    // Normalize on updates too
    const normalizedUser = updatedUser?._id
      ? updatedUser
      : updatedUser?.id
      ? { ...updatedUser, _id: updatedUser.id }
      : updatedUser;
    setUser(normalizedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        updateUserInContext,
        isBiometricSupported,
        isBiometricEnabled,
        enableBiometrics,
        disableBiometrics,
        loginWithBiometrics,
        lastPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
