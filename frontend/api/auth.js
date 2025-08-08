import { apiClient } from "./client";

export const login = (email, password) => {
  return apiClient.post("/auth/login/email", { email, password });
};

export const signup = (name, email, password) => {
  return apiClient.post("/auth/signup/email", { name, email, password });
};

export const updateUser = (token, userData) => {
  return apiClient.patch("/user/", userData);
};

export const refresh = (refresh_token) => {
  return apiClient.post("/auth/refresh", { refresh_token });
};
