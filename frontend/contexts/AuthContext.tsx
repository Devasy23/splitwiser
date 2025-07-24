import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

WebBrowser.maybeCompleteAuthSession();

const API_URL = "Your API URL here"; // Replace with your actual API URL

type AuthContextType = {
  isAuthenticated: boolean;
  user: any;
  accessToken: string | null;
  refreshToken: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (userData: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  googleLogin: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Google Auth request
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "your-web-client-id.apps.googleusercontent.com",
    androidClientId: "your-android-client-id.apps.googleusercontent.com",
  });

  // Handle Google sign-in response
  useEffect(() => {
    if (response?.type === "success") {
      const handleGoogleLogin = async () => {
        try {
          const { authentication } = response;
          if (!authentication?.accessToken) return;

          // Create Firebase credential
          const credential = GoogleAuthProvider.credential(null, authentication.accessToken);
          const userCredential = await signInWithCredential(auth, credential);

          // Get Firebase ID token
          const idToken = await userCredential.user.getIdToken(true);

          // Call backend
          await axios.post(`${API_URL}/auth/login/google`,
            { id_token: idToken },
            { headers: { "Content-Type": "application/json" } }
          );

          setUser(userCredential.user);
          setIsAuthenticated(true);
        } catch (err) {
          console.log("Google Sign-In Error:", err);
          alert("Login failed. Check network connection.");
        }
      };

      handleGoogleLogin();
    }
  }, [response]);

  // Axios setup
  useEffect(() => {
    axios.defaults.baseURL = API_URL;
    axios.interceptors.request.use((config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });

    axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;
          try {
            const response = await axios.post("/auth/refresh", { refresh_token: refreshToken });
            setAccessToken(response.data.access_token);
            if (response.data.refresh_token) {
              setRefreshToken(response.data.refresh_token);
              await SecureStore.setItemAsync("refreshToken", response.data.refresh_token);
            }
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
            return axios(originalRequest);
          } catch (err) {
            logout();
            return Promise.reject(err);
          }
        }
        return Promise.reject(error);
      }
    );

    const loadTokens = async () => {
      try {
        const storedRefreshToken = await SecureStore.getItemAsync("refreshToken");
        if (storedRefreshToken) {
          const response = await axios.post("/auth/refresh", { refresh_token: storedRefreshToken });
          setAccessToken(response.data.access_token);
          setRefreshToken(response.data.refresh_token || storedRefreshToken);
          setUser(response.data.user);
          setIsAuthenticated(true);
          if (response.data.refresh_token) {
            await SecureStore.setItemAsync("refreshToken", response.data.refresh_token);
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

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await axios.post("/auth/login/email", credentials);
      setAccessToken(response.data.access_token);
      setRefreshToken(response.data.refresh_token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      await SecureStore.setItemAsync("refreshToken", response.data.refresh_token);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: { email: string; password: string; name: string }) => {
    setLoading(true);
    try {
      const response = await axios.post("/auth/signup/email", userData);
      setAccessToken(response.data.access_token);
      setRefreshToken(response.data.refresh_token);
      setUser(response.data.user);
      console.log(response)
      setIsAuthenticated(true);
      await SecureStore.setItemAsync("refreshToken", response.data.refresh_token);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    await promptAsync();
  };

  const logout = async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    if (user && user.providerData?.some((p: any) => p.providerId === "google.com")) {
      try {
        await auth.signOut();
      } catch (e) {
        console.log("Error signing out from Google:", e);
      }
    }
    await SecureStore.deleteItemAsync("refreshToken");
  };

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
