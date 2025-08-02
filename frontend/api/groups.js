import axios from 'axios';

const API_URL = 'https://splitwiser-production.up.railway.app';

// This creates a new axios instance.
// It's better to have a single instance that can be configured with interceptors.
// I will create a single apiClient in a separate file later if needed.
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getGroups = (token) => {
  return apiClient.get('/groups', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getOptimizedSettlements = (token, groupId) => {
  return apiClient.post(`/groups/${groupId}/settlements/optimize`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createExpense = (token, groupId, expenseData) => {
  return apiClient.post(`/groups/${groupId}/expenses`, expenseData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getGroupDetails = (token, groupId) => {
    return Promise.all([
        getGroupMembers(token, groupId),
        getGroupExpenses(token, groupId),
    ]);
};

export const getGroupMembers = (token, groupId) => {
  return apiClient.get(`/groups/${groupId}/members`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getGroupExpenses = (token, groupId) => {
  return apiClient.get(`/groups/${groupId}/expenses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createGroup = (token, name) => {
  return apiClient.post('/groups', { name }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const joinGroup = (token, joinCode) => {
  return apiClient.post('/groups/join', { joinCode }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getUserBalanceSummary = (token) => {
  return apiClient.get('/users/me/balance-summary', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
