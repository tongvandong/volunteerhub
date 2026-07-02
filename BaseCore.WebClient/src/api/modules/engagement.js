import api from "../httpClient";

export const channelApi = {
  getAll: () => api.get("/channels"),
  getById: (id) => api.get(`/channels/${id}`),
  getPosts: (id, params) => api.get(`/channels/${id}/posts`, { params }),
  createPost: (id, data) => api.post(`/channels/${id}/posts`, data),
  updatePost: (id, postId, data) =>
    api.put(`/channels/${id}/posts/${postId}`, data),
  deletePost: (id, postId) => api.delete(`/channels/${id}/posts/${postId}`),
  toggleLike: (id, postId) =>
    api.post(`/channels/${id}/posts/${postId}/like`),
  togglePin: (id, postId) =>
    api.post(`/channels/${id}/posts/${postId}/toggle-pin`),
  getMembers: (id, query) =>
    api.get(`/channels/${id}/members`, { params: { query } }),
  getComments: (id, postId) =>
    api.get(`/channels/${id}/posts/${postId}/comments`),
  addComment: (id, postId, data) =>
    api.post(`/channels/${id}/posts/${postId}/comments`, data),
  deleteComment: (id, postId, commentId) =>
    api.delete(`/channels/${id}/posts/${postId}/comments/${commentId}`),
  createPoll: (id, postId, data) =>
    api.post(`/channels/${id}/posts/${postId}/poll`, data),
  votePoll: (id, pollId, optionId) =>
    api.post(`/channels/${id}/polls/${pollId}/vote`, { optionId }),
  getPollResults: (id, pollId) =>
    api.get(`/channels/${id}/polls/${pollId}/results`),
};

export const notificationApi = {
  getAll: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

export const badgeApi = {
  getAll: () => api.get("/badges"),
  getMyBadges: () => api.get("/my-badges"),
  create: (data) => api.post("/badges", data),
  update: (id, data) => api.put(`/badges/${id}`, data),
  delete: (id) => api.delete(`/badges/${id}`),
};

export const ratingApi = {
  create: (eventId, data) => api.post(`/events/${eventId}/ratings`, data),
  getByEvent: (eventId) => api.get(`/events/${eventId}/ratings`),
  update: (id, data) => api.put(`/ratings/${id}`, data),
  getUserRatings: (userId) => api.get(`/users/${userId}/ratings`),
  getAdminRatings: (params = {}) => api.get("/admin/ratings", { params }),
  hide: (id, reason) => api.put(`/ratings/${id}/hide`, { reason }),
  unhide: (id) => api.put(`/ratings/${id}/unhide`),
  delete: (id) => api.delete(`/ratings/${id}`),
};
