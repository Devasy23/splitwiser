import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";
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
          setUser(JSON.parse(storedUser));
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
      setUser(userData);
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
    await clearAuthTokens();
  };

  const updateUserInContext = (updatedUser) => {
    setUser(updatedUser);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
