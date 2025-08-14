import { apiClient } from "./client";

export const login = (email, password) => {
  return apiClient.post("/auth/login/email", { email, password });
};

export const signup = (name, email, password) => {
  return apiClient.post("/auth/signup/email", { name, email, password });
};

export const signInWithGoogle = (id_token) => {
  return apiClient.post('/auth/login/google', JSON.stringify({ id_token }));
};

export const updateUser = (userData) => apiClient.patch("/users/me", userData);

export const refresh = (refresh_token) => {
  return apiClient.post("/auth/refresh", { refresh_token });
};
