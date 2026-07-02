import axios from "axios";
import { authStorage } from "./authStorage";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshPromise = null;

const shouldSkipRefresh = (config = {}) => {
  const url = String(config.url || "");

  return (
    config.skipAuthRefresh ||
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh")
  );
};

const refreshAccessToken = async () => {
  const refreshToken = authStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh", { refreshToken }, { skipAuthRefresh: true })
      .then((response) => {
        const payload = response.data;
        const nextToken = payload?.token || payload?.accessToken;

        if (!nextToken) {
          throw new Error("Refresh response missing access token");
        }

        authStorage.setAuth({
          token: nextToken,
          refreshToken: payload?.refreshToken,
          user: payload?.user,
        });

        return nextToken;
      })
      .catch((error) => {
        authStorage.clear();
        window.location.href = "/login";
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    if (
      error?.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const nextToken = await refreshAccessToken();
    originalRequest.headers = {
      ...originalRequest.headers,
      Authorization: `Bearer ${nextToken}`,
    };

    return api(originalRequest);
  },
);

export default api;
