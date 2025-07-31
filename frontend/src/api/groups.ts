import { ApiResponse, Expense, Group, GroupMember, Settlement } from '@/types';
import axios, { AxiosResponse } from 'axios';

const API_URL = 'https://splitwiser-production.up.railway.app';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Token will be added per request as needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper function to create auth headers
const getAuthHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Group API functions
export const getGroups = (token: string): Promise<AxiosResponse<ApiResponse<Group[]>>> => {
  return apiClient.get('/groups', getAuthHeaders(token));
};

export const getOptimizedSettlements = (
  token: string, 
  groupId: string
): Promise<AxiosResponse<ApiResponse<{ optimizedSettlements: Settlement[] }>>> => {
  return apiClient.post(
    `/groups/${groupId}/settlements/optimize`, 
    {}, 
    getAuthHeaders(token)
  );
};

export const createExpense = (
  token: string, 
  groupId: string, 
  expenseData: any
): Promise<AxiosResponse<ApiResponse<Expense>>> => {
  return apiClient.post(
    `/groups/${groupId}/expenses`, 
    expenseData, 
    getAuthHeaders(token)
  );
};

export const getGroupDetails = (token: string, groupId: string) => {
  return Promise.all([
    getGroupMembers(token, groupId),
    getGroupExpenses(token, groupId),
  ]);
};

export const getGroupMembers = (
  token: string, 
  groupId: string
): Promise<AxiosResponse<ApiResponse<GroupMember[]>>> => {
  return apiClient.get(`/groups/${groupId}/members`, getAuthHeaders(token));
};

export const getGroupExpenses = (
  token: string, 
  groupId: string
): Promise<AxiosResponse<ApiResponse<{ expenses: Expense[] }>>> => {
  return apiClient.get(`/groups/${groupId}/expenses`, getAuthHeaders(token));
};

export const createGroup = (
  token: string, 
  name: string
): Promise<AxiosResponse<ApiResponse<Group>>> => {
  return apiClient.post('/groups', { name }, getAuthHeaders(token));
};

export const joinGroup = (
  token: string, 
  joinCode: string
): Promise<AxiosResponse<ApiResponse<Group>>> => {
  return apiClient.post('/groups/join', { joinCode }, getAuthHeaders(token));
};

export const addExpense = (
  token: string,
  expenseData: {
    groupId: string;
    description: string;
    amount: number;
    splitType: 'equal' | 'unequal';
    participants: string[];
    customSplits?: { [userId: string]: string };
  }
): Promise<AxiosResponse<ApiResponse<Expense>>> => {
  return apiClient.post('/expenses', expenseData, getAuthHeaders(token));
};
