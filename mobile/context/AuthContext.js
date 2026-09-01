import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
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
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [storedCredentials, setStoredCredentials] = useState(null);

  // Load token and user data from AsyncStorage on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        const storedRefresh = await AsyncStorage.getItem("refresh_token");
        const storedUser = await AsyncStorage.getItem("user_data");
        const biometricPref = await AsyncStorage.getItem("biometric_enabled");

        const isBiometric = biometricPref === "true";
        setIsBiometricEnabled(isBiometric);

        if (storedToken && storedUser) {
          // Normalize user id shape
          const parsed = JSON.parse(storedUser);
          const normalized = parsed?._id
            ? parsed
            : parsed?.id
            ? { ...parsed, _id: parsed.id }
            : parsed;

          setStoredCredentials({
            token: storedToken,
            refresh: storedRefresh,
            user: normalized
          });

          if (isBiometric) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: "Authenticate to login",
              fallbackLabel: "Use Password",
            });

            if (result.success) {
              setToken(storedToken);
              setRefresh(storedRefresh);
              await setAuthTokens({
                newAccessToken: storedToken,
                newRefreshToken: storedRefresh,
              });
              setUser(normalized);
            }
          } else {
            setToken(storedToken);
            setRefresh(storedRefresh);
            await setAuthTokens({
              newAccessToken: storedToken,
              newRefreshToken: storedRefresh,
            });
            setUser(normalized);
          }
        }
      } catch (error) {
        console.error("Failed to load stored authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
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

  const authenticateBiometric = async () => {
    if (!storedCredentials) return false;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to login",
        fallbackLabel: "Use Password",
      });

      if (result.success) {
        setToken(storedCredentials.token);
        setRefresh(storedCredentials.refresh);
        await setAuthTokens({
          newAccessToken: storedCredentials.token,
          newRefreshToken: storedCredentials.refresh,
        });
        setUser(storedCredentials.user);
        return true;
      }
    } catch (error) {
      console.error("Biometric authentication failed:", error);
    }
    return false;
  };

  const enableBiometric = async () => {
    try {
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { success: false, error: "No biometrics enrolled on this device." };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to enable biometric login",
      });

      if (result.success) {
        await AsyncStorage.setItem("biometric_enabled", "true");
        setIsBiometricEnabled(true);
        // Also save current credentials if not already stored
        if (token && user) {
          setStoredCredentials({ token, refresh, user });
        }
        return { success: true };
      }
      return { success: false, error: "Authentication failed." };
    } catch (error) {
      console.error("Failed to enable biometrics:", error);
      return { success: false, error: "An error occurred." };
    }
  };

  const disableBiometric = async () => {
    try {
      await AsyncStorage.setItem("biometric_enabled", "false");
      setIsBiometricEnabled(false);
      return { success: true };
    } catch (error) {
      console.error("Failed to disable biometrics:", error);
      return { success: false, error: "An error occurred." };
    }
  };

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
    setStoredCredentials(null);
    await AsyncStorage.removeItem("biometric_enabled");
    setIsBiometricEnabled(false);
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
        isBiometricEnabled,
        enableBiometric,
        disableBiometric,
        authenticateBiometric,
        storedCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
