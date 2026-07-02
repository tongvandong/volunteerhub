import api from "../httpClient";

export const eventApi = {
  getAll: (params) => api.get("/events", { params }),
  getMine: () => api.get("/events/my"),
  getById: (id) => api.get(`/events/${id}`),
  getRecommended: () => api.get("/events/recommended"),
  getImpact: (id) => api.get(`/events/${id}/impact`),
  create: (data) => api.post("/events", data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  approve: (id) => api.put(`/events/${id}/approve`),
  rotateQr: (id) => api.post(`/events/${id}/qr/rotate`),
  reject: (id, data = {}) => api.put(`/events/${id}/reject`, data),
  complete: (id, data = {}) => api.put(`/events/${id}/complete`, data),
  cancel: (id, reason) => api.put(`/events/${id}/cancel`, { reason }),
  resubmit: (id) => api.post(`/events/${id}/resubmit`),
  uncomplete: (id) => api.post(`/events/${id}/uncomplete`),
  transfer: (id, data) => api.put(`/events/${id}/transfer`, data),
  overduePreview: () => api.get("/events/overdue-preview"),
  autoCompleteOverdue: () => api.post("/events/auto-complete-overdue"),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`),
  getEventHistory: (id) => api.get(`/events/${id}/history`),
  getShifts: (id) => api.get(`/events/${id}/shifts`),
  createShift: (id, data) => api.post(`/events/${id}/shifts`, data),
  updateShift: (eventId, shiftId, data) =>
    api.put(`/events/${eventId}/shifts/${shiftId}`, data),
  deleteShift: (eventId, shiftId) =>
    api.delete(`/events/${eventId}/shifts/${shiftId}`),
};

export const recommendationApi = {
  eventsForMe: (limit = 5) =>
    api.get("/recommendations/events", { params: { limit } }),
  volunteersForEvent: (eventId, limit = 10) =>
    api.get(`/recommendations/events/${eventId}/volunteers`, {
      params: { limit },
    }),
  sponsorsForEvent: (eventId, limit = 10) =>
    api.get(`/recommendations/events/${eventId}/sponsors`, {
      params: { limit },
    }),
  similarVolunteers: (userId, limit = 10) =>
    api.get(`/recommendations/volunteers/${userId}/similar`, {
      params: { limit },
    }),
};

export const registrationApi = {
  register: (eventId, data) => api.post(`/events/${eventId}/register`, data),
  withdraw: (eventId) => api.delete(`/events/${eventId}/register`),
  getMyRegistration: (eventId) =>
    api.get(`/events/${eventId}/my-registration`),
  confirm: (eventId, regId) =>
    api.put(`/events/${eventId}/registrations/${regId}/confirm`),
  cancel: (eventId, regId) =>
    api.put(`/events/${eventId}/registrations/${regId}/cancel`),
  requestCancelRegistration: (eventId, reason) =>
    api.post(`/events/${eventId}/register/cancel-request`, { reason }),
  walkIn: (eventId, data) => api.post(`/events/${eventId}/walk-in`, data),
  manualAttend: (eventId, regId, hours) =>
    api.post(`/events/${eventId}/registrations/${regId}/manual-attend`, {
      hours,
    }),
  checkOut: (eventId, regId) =>
    api.post(`/events/${eventId}/registrations/${regId}/checkout`),
  adjustHours: (eventId, regId, hours) =>
    api.put(`/events/${eventId}/registrations/${regId}/hours`, { hours }),
  changeShift: (eventId, regId, shiftId) =>
    api.put(`/events/${eventId}/registrations/${regId}/shift`, { shiftId }),
  checkin: (eventId, regId, data) =>
    api.post(`/events/${eventId}/registrations/${regId}/checkin`, data),
  selfCheckin: (eventId, data) =>
    api.post(`/events/${eventId}/self-checkin`, data),
  getMyRegistrations: () => api.get("/my-registrations"),
  scheduleInterview: (eventId, regId, data) =>
    api.post(`/events/${eventId}/registrations/${regId}/interview`, data),
  updateInterview: (eventId, regId, data) =>
    api.put(`/events/${eventId}/registrations/${regId}/interview`, data),
  decideInterview: (eventId, regId, data) =>
    api.put(`/events/${eventId}/registrations/${regId}/interview/outcome`, data),
  cancelInterview: (eventId, regId) =>
    api.delete(`/events/${eventId}/registrations/${regId}/interview`),
};

export const interviewCallApi = {
  getDailyToken: (slotId) => api.get(`/interviews/${slotId}/daily-token`),
};

export const eventCategoryApi = {
  getAll: () => api.get("/event-categories"),
  create: (data) => api.post("/event-categories", data),
  update: (id, data) => api.put(`/event-categories/${id}`, data),
  delete: (id) => api.delete(`/event-categories/${id}`),
};
