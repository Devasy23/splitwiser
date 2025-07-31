import * as authApi from '@/api/auth';
import { AuthState, User } from '@/types';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserInContext: (updatedUser: User) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(user && token);

  // For now, we are not persisting the token. A real app would use AsyncStorage.
  // This effect will just simulate checking for a token on app start.
  useEffect(() => {
    // TODO: Check for stored token in AsyncStorage
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);
      const { access_token, user: userData } = response.data;
      setToken(access_token);
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error('Login failed:', error.response?.data?.detail || error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await authApi.signup(name, email, password);
      return true;
    } catch (error: any) {
      console.error('Signup failed:', error.response?.data?.detail || error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
  };

  const updateUserInContext = (updatedUser: User): void => {
    setUser(updatedUser);
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateUserInContext,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
