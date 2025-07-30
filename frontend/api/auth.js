import axios from 'axios';

const API_URL = 'https://splitwiser-production.up.railway.app';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = (email, password) => {
  return apiClient.post('/auth/login/email', { email, password });
};

export const signup = (name, email, password) => {
  return apiClient.post('/auth/signup/email', { name, email, password });
};
