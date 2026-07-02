import api from "../httpClient";

export const authApi = {
  login: (identifier, password) =>
    api.post("/auth/login", {
      email: identifier,
      password,
    }),
  register: (data) => api.post("/auth/register", data),
  verifyRegistration: (data) => api.post("/auth/verify-registration", data),
  forgotPassword: (identifier) =>
    api.post("/auth/forgot-password", { identifier }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  me: () => api.get("/auth/me"),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  logout: (refreshToken) =>
    api.post("/auth/logout", refreshToken ? { refreshToken } : undefined),
};
