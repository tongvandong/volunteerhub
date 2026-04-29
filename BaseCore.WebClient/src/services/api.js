import axios from 'axios';

const authStorage = {
  getToken: () => localStorage.getItem('token'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  getUser: () => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  setAuth: ({ token, refreshToken, user }) => {
    if (token) {
      localStorage.setItem('token', token);
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
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
  const url = String(config.url || '');

  return (
    config.skipAuthRefresh ||
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh')
  );
};

const refreshAccessToken = async () => {
  const refreshToken = authStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', { refreshToken }, { skipAuthRefresh: true })
      .then((response) => {
        const payload = response.data;
        const nextToken = payload?.token || payload?.accessToken;

        if (!nextToken) {
          throw new Error('Refresh response missing access token');
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
        window.location.href = '/login';
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
  }
);

export { authStorage };

export const authApi = {
  login: (identifier, password) =>
    api.post('/auth/login', {
      email: identifier,
      password,
    }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) =>
    api.post('/auth/logout', refreshToken ? { refreshToken } : undefined),
};

export const eventApi = {
  getAll: (params) => api.get('/events', { params }),
  getMine: () => api.get('/events/my'),
  getById: (id) => api.get(`/events/${id}`),
  getRecommended: () => api.get('/events/recommended'),
  getImpact: (id) => api.get(`/events/${id}/impact`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  approve: (id) => api.put(`/events/${id}/approve`),
  reject: (id) => api.put(`/events/${id}/reject`),
  complete: (id) => api.put(`/events/${id}/complete`),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`),
  getShifts: (id) => api.get(`/events/${id}/shifts`),
  createShift: (id, data) => api.post(`/events/${id}/shifts`, data),
};

export const registrationApi = {
  register: (eventId, data) => api.post(`/events/${eventId}/register`, data),
  withdraw: (eventId) => api.delete(`/events/${eventId}/register`),
  getMyRegistration: (eventId) => api.get(`/events/${eventId}/my-registration`),
  confirm: (eventId, regId) => api.put(`/events/${eventId}/registrations/${regId}/confirm`),
  cancel: (eventId, regId) => api.put(`/events/${eventId}/registrations/${regId}/cancel`),
  checkin: (eventId, regId, data) => api.post(`/events/${eventId}/registrations/${regId}/checkin`, data),
  getMyRegistrations: () => api.get('/my-registrations'),
};

export const eventCategoryApi = {
  getAll: () => api.get('/event-categories'),
  create: (data) => api.post('/event-categories', data),
  update: (id, data) => api.put(`/event-categories/${id}`, data),
  delete: (id) => api.delete(`/event-categories/${id}`),
};

export const channelApi = {
  getAll: () => api.get('/channels'),
  getById: (id) => api.get(`/channels/${id}`),
  getPosts: (id, params) => api.get(`/channels/${id}/posts`, { params }),
  createPost: (id, data) => api.post(`/channels/${id}/posts`, data),
  updatePost: (id, postId, data) => api.put(`/channels/${id}/posts/${postId}`, data),
  deletePost: (id, postId) => api.delete(`/channels/${id}/posts/${postId}`),
  toggleLike: (id, postId) => api.post(`/channels/${id}/posts/${postId}/like`),
  getComments: (id, postId) => api.get(`/channels/${id}/posts/${postId}/comments`),
  addComment: (id, postId, data) => api.post(`/channels/${id}/posts/${postId}/comments`, data),
  deleteComment: (id, postId, commentId) => api.delete(`/channels/${id}/posts/${postId}/comments/${commentId}`),
};

export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const profileApi = {
  getMyProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  getPassport: () => api.get('/profile/passport'),
  getUserProfile: (userId) => api.get(`/profile/${userId}`),
};

export const skillApi = {
  getAll: () => api.get('/skills'),
  create: (data) => api.post('/skills', data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
};

export const profileSkillApi = {
  add: (data) => api.post('/profile/skills', data),
  remove: (skillId) => api.delete(`/profile/skills/${skillId}`),
};

export const certificateApi = {
  getMyCertificates: () => api.get('/certificates'),
  verify: (code) => api.get(`/certificates/${code}`),
  getPdfUrl: (code) => `/api/certificates/${encodeURIComponent(code)}/pdf`,
};

export const badgeApi = {
  getAll: () => api.get('/badges'),
  getMyBadges: () => api.get('/my-badges'),
};

export const ratingApi = {
  create: (eventId, data) => api.post(`/events/${eventId}/ratings`, data),
  getUserRatings: (userId) => api.get(`/users/${userId}/ratings`),
};

export const sponsorApi = {
  getByEvent: (eventId) => api.get(`/events/${eventId}/sponsors`),
  addSponsor: (eventId, data) => api.post(`/events/${eventId}/sponsors`, data),
  getMySponsorships: () => api.get('/sponsors/my'),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const adminApi = {
  getUsers: (params = {}) => {
    const { search, ...rest } = params;
    return api.get('/admin/users', { params: { ...rest, keyword: search } });
  },
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  exportEvents: (format) =>
    api.get('/admin/export/events', {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json',
    }),
  exportUsers: (format) =>
    api.get('/admin/export/users', {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json',
    }),
};

export default api;
