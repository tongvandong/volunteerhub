import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android emulator: 10.0.2.2 maps to the host machine's localhost, where Caddy (Docker)
// listens on :80 and proxies /api -> gateway. Web preview chạy ngay trên host nên dùng localhost.
// Đổi sang IP LAN / VPS khi build cho thiết bị thật.
export const ORIGIN = Platform.OS === 'web' ? 'http://localhost' : 'http://10.0.2.2';
export const API_BASE = `${ORIGIN}/api`;
export const HUB_CHANNEL_URL = `${ORIGIN}/hubs/channel`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// --- endpoint groups (mirrors the web services/api.js) ---
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
};

export const recommendationApi = {
  eventsForMe: (limit = 6) => api.get('/recommendations/events', { params: { limit } }),
  volunteersForEvent: (eventId, limit = 10) => api.get(`/recommendations/events/${eventId}/volunteers`, { params: { limit } }),
  sponsorsForEvent: (eventId, limit = 10) => api.get(`/recommendations/events/${eventId}/sponsors`, { params: { limit } }),
};

export const eventApi = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  getMine: () => api.get('/events/my'),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`),
  approve: (id) => api.put(`/events/${id}/approve`),
  reject: (id, data = {}) => api.put(`/events/${id}/reject`, data),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  cancel: (id, reason) => api.put(`/events/${id}/cancel`, { reason }),
  complete: (id, data = {}) => api.put(`/events/${id}/complete`, data),
  getShifts: (id) => api.get(`/events/${id}/shifts`),
  createShift: (id, data) => api.post(`/events/${id}/shifts`, data),
  deleteShift: (eventId, shiftId) => api.delete(`/events/${eventId}/shifts/${shiftId}`),
};

export const skillApi = {
  getAll: () => api.get('/skills'),
  create: (data) => api.post('/skills', data),
  delete: (id) => api.delete(`/skills/${id}`),
};

export const eventCategoryApi = {
  getAll: () => api.get('/event-categories'),
  create: (data) => api.post('/event-categories', data),
  delete: (id) => api.delete(`/event-categories/${id}`),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
  getOrganizerInsights: (params = {}) => api.get('/dashboard/organizer-insights', { params }),
};

export const adminApi = {
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  getOrganizerVerifications: (params = {}) => api.get('/admin/organizer-verifications', { params }),
  approveOrganizerVerification: (id, data = {}) => api.put(`/admin/organizer-verifications/${id}/approve`, data),
  rejectOrganizerVerification: (id, data = {}) => api.put(`/admin/organizer-verifications/${id}/reject`, data),
  getVolunteerKycRequests: (params = {}) => api.get('/admin/volunteer-kyc', { params }),
  approveVolunteerKyc: (id, data = {}) => api.put(`/admin/volunteer-kyc/${id}/approve`, data),
  rejectVolunteerKyc: (id, data = {}) => api.put(`/admin/volunteer-kyc/${id}/reject`, data),
  getVolunteerSkillVerifications: (params = {}) => api.get('/admin/volunteer-skill-verifications', { params }),
  approveVolunteerSkill: (id, data = {}) => api.put(`/admin/volunteer-skill-verifications/${id}/approve`, data),
  rejectVolunteerSkill: (id, data = {}) => api.put(`/admin/volunteer-skill-verifications/${id}/reject`, data),
  getMonitoringSummary: () => api.get('/admin/monitoring/summary'),
  getFinanceOverview: () => api.get('/admin/finance/overview'),
  getStaleDonations: (params = {}) => api.get('/admin/finance/stale-donations', { params }),
  exportEvents: () => api.get('/admin/export/events', { params: { format: 'csv' }, responseType: 'text' }),
  exportUsers: () => api.get('/admin/export/users', { params: { format: 'csv' }, responseType: 'text' }),
  exportFinance: () => api.get('/admin/export/finance', { params: { format: 'csv' }, responseType: 'text' }),
};

export const interviewCallApi = {
  // Trả { sdkAppId, userId, userSig, roomId } khi TRTC đã cấu hình; 503 nếu chưa.
  getTrtcToken: (slotId) => api.get(`/interviews/${slotId}/trtc-token`),
};

export const channelApi = {
  getAll: () => api.get('/channels'),
  getById: (id) => api.get(`/channels/${id}`),
  getPosts: (id, params) => api.get(`/channels/${id}/posts`, { params }),
  createPost: (id, data) => api.post(`/channels/${id}/posts`, data),
  toggleLike: (id, postId) => api.post(`/channels/${id}/posts/${postId}/like`),
  getComments: (id, postId) => api.get(`/channels/${id}/posts/${postId}/comments`),
  addComment: (id, postId, data) => api.post(`/channels/${id}/posts/${postId}/comments`, data),
  votePoll: (id, pollId, optionId) => api.post(`/channels/${id}/polls/${pollId}/vote`, { optionId }),
  getPollResults: (id, pollId) => api.get(`/channels/${id}/polls/${pollId}/results`),
};

export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  registerDeviceToken: (token, platform) => api.post('/notifications/device-token', { token, platform }),
  removeDeviceToken: (token) => api.delete('/notifications/device-token', { data: { token } }),
};

export const registrationApi = {
  register: (eventId, data = {}) => api.post(`/events/${eventId}/register`, data),
  withdraw: (eventId) => api.delete(`/events/${eventId}/register`),
  getMyRegistration: (eventId) => api.get(`/events/${eventId}/my-registration`),
  getMyRegistrations: () => api.get('/my-registrations'),
  // self check-in bằng QR và/hoặc GPS: data = { qrCode?, latitude?, longitude? }
  selfCheckin: (eventId, data) => api.post(`/events/${eventId}/self-checkin`, data),
  // organizer
  confirm: (eventId, regId) => api.put(`/events/${eventId}/registrations/${regId}/confirm`),
  cancel: (eventId, regId) => api.put(`/events/${eventId}/registrations/${regId}/cancel`),
  walkIn: (eventId, data) => api.post(`/events/${eventId}/walk-in`, data),
  manualAttend: (eventId, regId, hours) => api.post(`/events/${eventId}/registrations/${regId}/manual-attend`, { hours }),
  checkOut: (eventId, regId) => api.post(`/events/${eventId}/registrations/${regId}/checkout`),
};

export const profileApi = {
  getMyProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  submitKyc: (data) => api.post('/profile/kyc', data),
  getPassport: () => api.get('/profile/passport'),
  getUserProfile: (userId) => api.get(`/profile/${userId}`),
};

export const profileSkillApi = {
  add: (data) => api.post('/profile/skills', data),
  remove: (skillId) => api.delete(`/profile/skills/${skillId}`),
};

export const certificateApi = {
  getMyCertificates: () => api.get('/certificates'),
  verify: (code) => api.get(`/certificates/${code}`),
  pdfUrl: (code) => `${API_BASE}/certificates/${encodeURIComponent(code)}/pdf`,
};

export const badgeApi = {
  getAll: () => api.get('/badges'),
  getMyBadges: () => api.get('/my-badges'),
  create: (data) => api.post('/badges', data),
  delete: (id) => api.delete(`/badges/${id}`),
};

export const ratingApi = {
  create: (eventId, data) => api.post(`/events/${eventId}/ratings`, data),
  getAdminRatings: (params = {}) => api.get('/admin/ratings', { params }),
  hide: (id, reason) => api.put(`/ratings/${id}/hide`, { reason }),
  unhide: (id) => api.put(`/ratings/${id}/unhide`),
};

export const sponsorApi = {
  getMySponsorships: () => api.get('/sponsors/my'),
};

export const sponsorProfileApi = {
  get: () => api.get('/sponsor/profile'),
  update: (data) => api.put('/sponsor/profile', data),
};

export const supportCampaignApi = {
  getByEvent: (eventId) => api.get(`/events/${eventId}/support-campaigns`),
  create: (eventId, data) => api.post(`/events/${eventId}/support-campaigns`, data),
  getDonations: (campaignId) => api.get(`/support-campaigns/${campaignId}/donations`),
  donate: (campaignId, data) => api.post(`/support-campaigns/${campaignId}/donations`, data),
  getMyDonations: () => api.get('/donations/my'),
  confirmDonation: (donationId) => api.put(`/donations/${donationId}/confirm`),
  report: (campaignId, data) => api.post(`/support-campaigns/${campaignId}/report`, data),
};

export const sponsorshipProposalApi = {
  getMy: () => api.get('/sponsorship-proposals/my'),
  getByEvent: (eventId) => api.get(`/events/${eventId}/sponsorship-proposals`),
  organizerRequest: (eventId, data) => api.post(`/events/${eventId}/sponsorship-proposals/organizer-request`, data),
  accept: (proposalId, data = {}) => api.put(`/sponsorship-proposals/${proposalId}/accept`, data),
  reject: (proposalId, data = {}) => api.put(`/sponsorship-proposals/${proposalId}/reject`, data),
};

export const organizerVerificationApi = {
  getMine: () => api.get('/organizer/verification'),
  submit: (data) => api.post('/organizer/verification', data),
};

export const uploadApi = {
  // asset: { uri, fileName?, mimeType? } từ expo-image-picker
  uploadImage: (asset) => {
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName || 'photo.jpg',
      type: asset.mimeType || 'image/jpeg',
    });
    return api.post('/uploads/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
