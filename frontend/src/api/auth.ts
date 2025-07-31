import { ApiResponse, AuthResponse, User } from '@/types';
import axios, { AxiosResponse } from 'axios';

const API_URL = 'https://splitwiser-production.up.railway.app';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Auth API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const login = (
  email: string, 
  password: string
): Promise<AxiosResponse<AuthResponse>> => {
  return apiClient.post('/auth/login/email', { email, password });
};

export const signup = (
  name: string, 
  email: string, 
  password: string
): Promise<AxiosResponse<ApiResponse<any>>> => {
  return apiClient.post('/auth/signup/email', { name, email, password });
};

export const updateUser = (
  token: string, 
  userData: Partial<User>
): Promise<AxiosResponse<ApiResponse<User>>> => {
  return apiClient.patch('/user/', userData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
