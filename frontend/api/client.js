import axios from "axios";

const API_URL = "https://splitwiser-production.up.railway.app";

let accessToken = null;
let refreshToken = null;
let isRefreshing = false;
let refreshPromise = null;
let tokenUpdateListener = null; // function({ accessToken, refreshToken })

export const setTokenUpdateListener = (fn) => {
  tokenUpdateListener = fn;
};

export const setAuthTokens = async ({ newAccessToken, newRefreshToken }) => {
  if (newAccessToken) accessToken = newAccessToken;
  if (newRefreshToken) refreshToken = newRefreshToken;
};

export const clearAuthTokens = async () => {
  accessToken = null;
  refreshToken = null;
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach Authorization header
apiClient.interceptors.request.use((config) => {
  if (accessToken && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

async function performRefresh() {
  // Avoid multiple refresh calls
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      if (!refreshToken) throw new Error("No refresh token");
      const resp = await axios.post(
        `${API_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );
      const { access_token, refresh_token } = resp.data || {};
      accessToken = access_token || accessToken;
      refreshToken = refresh_token || refreshToken;
      // Notify listener (AuthContext) so it can persist & update state
      if (tokenUpdateListener) {
        tokenUpdateListener({ accessToken, refreshToken });
      }
      return accessToken;
    } finally {
      isRefreshing = false;
      const p = refreshPromise; // preserve for awaiting callers
      refreshPromise = null;
      return p; // not used
    }
  })();
  return refreshPromise;
}

// Retry logic on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    // Avoid refresh loop
    const isAuthRefreshCall = originalRequest.url?.includes("/auth/refresh");

    if (status === 401 && !originalRequest._retry && !isAuthRefreshCall) {
      originalRequest._retry = true;
      try {
        await performRefresh();
        // Set new Authorization and retry
        originalRequest.headers = originalRequest.headers || {};
        if (accessToken)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (e) {
        // Propagate original error; caller should handle logout
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
