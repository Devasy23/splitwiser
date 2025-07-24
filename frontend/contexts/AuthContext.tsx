import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

WebBrowser.maybeCompleteAuthSession();

// API base URL
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Auth context type for better type safety
type AuthContextType = {
  isAuthenticated: boolean;
  user: any;
  accessToken: string | null;
  refreshToken: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (userData: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  loading: boolean;
};

// Context creation
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to access auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Google login setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  /**
   * Google Sign-In handler
   * Triggered automatically when Google sign-in response is received
   */
  useEffect(() => {
    if (response?.type !== "success") return;

    const handleGoogleLogin = async () => {
      try {
        const { authentication } = response;
        if (!authentication?.accessToken) return;

        // Firebase credential from Google token
        const credential = GoogleAuthProvider.credential(null, authentication.accessToken);
        const userCredential = await signInWithCredential(auth, credential);

        // Get Firebase ID token & send to backend
        const idToken = await userCredential.user.getIdToken(true);
        await axios.post(`${API_URL}/auth/login/google`, { id_token: idToken });

        // Update state
        setUser(userCredential.user);
        setIsAuthenticated(true);
      } catch (error) {
        const err = error as AxiosError;
        console.error("Google Sign-In Error:", err);
        alert(err.response?.data || err.message || "Google sign-in failed. Please try again.");
      }
    };

    handleGoogleLogin();
  }, [response]);

  /**
   * Axios interceptors:
   * 1) Adds Authorization header
   * 2) Handles token refresh on 401
   * Cleanup on unmount or token changes
   */
  useEffect(() => {
    axios.defaults.baseURL = API_URL;

    // Attach token to every request
    const reqInterceptor = axios.interceptors.request.use((config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });

    // Handle expired tokens and retry requests
    const resInterceptor = axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;
          try {
            const { data } = await axios.post("/auth/refresh", { refresh_token: refreshToken });
            setAccessToken(data.access_token);
            if (data.refresh_token) {
              setRefreshToken(data.refresh_token);
              await SecureStore.setItemAsync("refreshToken", data.refresh_token);
            }
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return axios(originalRequest);
          } catch (err) {
            await logout();
            return Promise.reject(err);
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [accessToken, refreshToken]);

  /**
   * Load tokens on app start
   */
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const storedRefreshToken = await SecureStore.getItemAsync("refreshToken");
        if (storedRefreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: storedRefreshToken });
          setAccessToken(data.access_token);
          setRefreshToken(data.refresh_token || storedRefreshToken);
          setUser(data.user);
          setIsAuthenticated(true);

          // Store updated refresh token if returned
          if (data.refresh_token) {
            await SecureStore.setItemAsync("refreshToken", data.refresh_token);
          }
        }
      } catch {
        await SecureStore.deleteItemAsync("refreshToken");
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  /**
   * Email/Password login
   */
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/auth/login/email", credentials);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setUser(data.user);
      setIsAuthenticated(true);
      await SecureStore.setItemAsync("refreshToken", data.refresh_token);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Email/Password signup
   */
  const signup = useCallback(async (userData: { email: string; password: string; name: string }) => {
    setLoading(true);
    try {
      const { data } = await axios.post("/auth/signup/email", userData);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setUser(data.user);
      setIsAuthenticated(true);
      await SecureStore.setItemAsync("refreshToken", data.refresh_token);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Trigger Google OAuth
   */
  const googleLogin = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  /**
   * Logout user:
   * 1) Clears tokens & state
   * 2) Signs out of Google if logged in via Google
   */
  const logout = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // Google logout if provider is google.com
    if (user?.providerData?.some((p: any) => p.providerId === "google.com")) {
      try {
        await auth.signOut();
      } catch (e) {
        console.log("Error signing out from Google:", e);
      }
    }
    await SecureStore.deleteItemAsync("refreshToken");
  }, [user]);

  // Context provider
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
        googleLogin,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
