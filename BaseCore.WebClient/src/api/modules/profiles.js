import api from "../httpClient";

export const profileApi = {
  getMyProfile: () => api.get("/profile"),
  updateProfile: (data) => api.put("/profile", data),
  submitKyc: (data) => api.post("/profile/kyc", data),
  getPassport: () => api.get("/profile/passport"),
  getUserProfile: (userId) => api.get(`/profile/${userId}`),
};

export const skillApi = {
  getAll: () => api.get("/skills"),
  create: (data) => api.post("/skills", data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
};

export const profileSkillApi = {
  add: (data) => api.post("/profile/skills", data),
  submitVerification: (skillId, data) =>
    api.put(`/profile/skills/${skillId}/verification`, data),
  remove: (skillId) => api.delete(`/profile/skills/${skillId}`),
};

export const sponsorProfileApi = {
  get: () => api.get("/sponsor/profile"),
  update: (data) => api.put("/sponsor/profile", data),
};

export const organizerVerificationApi = {
  getMine: () => api.get("/organizer/verification"),
  submit: (data) => api.post("/organizer/verification", data),
};

export const userApi = {
  getVolunteerLookup: (params = {}) => api.get("/users/volunteers", { params }),
};
