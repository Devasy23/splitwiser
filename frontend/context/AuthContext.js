import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthRequest } from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { createContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import {
  clearAuthTokens,
  setAuthTokens,
  setTokenUpdateListener,
} from "../api/client";

WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refresh, setRefresh] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // For Expo Go, we need to use the web-based auth flow
  // Force all platforms to use web client ID in Expo Go
  const [request, response, promptAsync] = useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Force web client for iOS in Expo Go
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Force web client for Android in Expo Go
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: 'https://auth.expo.io/@devasy23/frontend',
  });

  // Debug logging
  useEffect(() => {
    if (request) {
      console.log("Auth request details:", {
        url: request.url,
        params: request.params
      });
    }
  }, [request]);

  useEffect(() => {
    const handleGoogleSignIn = async () => {
      if (response?.type === "success") {
        const { id_token } = response.params;
        try {
          const res = await authApi.loginWithGoogle(id_token);
          const { access_token, refresh_token, user: userData } = res.data;
          setToken(access_token);
          setRefresh(refresh_token);
          await setAuthTokens({
            newAccessToken: access_token,
            newRefreshToken: refresh_token,
          });
          const normalizedUser = userData?._id
            ? userData
            : userData?.id
            ? { ...userData, _id: userData.id }
            : userData;
          setUser(normalizedUser);
        } catch (error) {
          console.error(
            "Google login failed:",
            error.response?.data?.detail || error.message
          );
        }
      }
    };

    handleGoogleSignIn();
  }, [response]);

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

  const loginWithGoogle = async () => {
    await promptAsync();
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
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
