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

export const createExpense = (token, groupId, expenseData) => {
  return apiClient.post(`/groups/${groupId}/expenses`, expenseData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getGroupDetails = (token, groupId) => {
    // Note: The backend doesn't seem to have a dedicated group details endpoint.
    // The POC reuses the group object from the list. We will do the same for now,
    // but in a real app, a dedicated endpoint would be better.
    // This is a placeholder for if we had one.
    // For now, we will fetch members and expenses separately.
    // This function can be used to get the group's basic info if needed.
    // However, the /groups endpoint already provides this.
    // We will simulate fetching details by combining other calls.
    // A single /groups/:id endpoint would be more efficient.
    // For now, let's assume we don't need this function and will get group name from navigation params.
    return Promise.resolve(null); // Placeholder
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
