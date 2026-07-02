import api from "../httpClient";

export const dashboardApi = {
  get: () => api.get("/dashboard"),
  getOrganizerInsights: (params = {}) =>
    api.get("/dashboard/organizer-insights", { params }),
};

export const adminApi = {
  getUsers: (params = {}) => {
    const { search, ...rest } = params;
    return api.get("/admin/users", { params: { ...rest, keyword: search } });
  },
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post("/admin/users", data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  getOrganizerVerifications: (params = {}) =>
    api.get("/admin/organizer-verifications", { params }),
  approveOrganizerVerification: (id, data = {}) =>
    api.put(`/admin/organizer-verifications/${id}/approve`, data),
  rejectOrganizerVerification: (id, data = {}) =>
    api.put(`/admin/organizer-verifications/${id}/reject`, data),
  requestOrganizerVerificationChanges: (id, data = {}) =>
    api.put(`/admin/organizer-verifications/${id}/request-changes`, data),
  getVolunteerKycRequests: (params = {}) =>
    api.get("/admin/volunteer-kyc", { params }),
  approveVolunteerKyc: (id, data = {}) =>
    api.put(`/admin/volunteer-kyc/${id}/approve`, data),
  rejectVolunteerKyc: (id, data = {}) =>
    api.put(`/admin/volunteer-kyc/${id}/reject`, data),
  requestVolunteerKycChanges: (id, data = {}) =>
    api.put(`/admin/volunteer-kyc/${id}/request-changes`, data),
  getVolunteerSkillVerifications: (params = {}) =>
    api.get("/admin/volunteer-skill-verifications", { params }),
  approveVolunteerSkill: (id, data = {}) =>
    api.put(`/admin/volunteer-skill-verifications/${id}/approve`, data),
  rejectVolunteerSkill: (id, data = {}) =>
    api.put(`/admin/volunteer-skill-verifications/${id}/reject`, data),
  requestVolunteerSkillChanges: (id, data = {}) =>
    api.put(`/admin/volunteer-skill-verifications/${id}/request-changes`, data),
  getMonitoringHealth: () => api.get("/monitoring/health"),
  getMonitoringSummary: () => api.get("/admin/monitoring/summary"),
  getAuditLogs: (params = {}) => api.get("/admin/audit-logs", { params }),
  getFinanceOverview: () => api.get("/admin/finance/overview"),
  getStaleDonations: (params = {}) =>
    api.get("/admin/finance/stale-donations", { params }),
  getUnreportedCampaigns: () =>
    api.get("/admin/finance/unreported-campaigns"),
  getOpenProposalsPastEvent: () =>
    api.get("/admin/finance/open-proposals-past-event"),
  exportEvents: (format) =>
    api.get("/admin/export/events", {
      params: { format },
      responseType: format === "csv" ? "blob" : "json",
    }),
  exportUsers: (format) =>
    api.get("/admin/export/users", {
      params: { format },
      responseType: format === "csv" ? "blob" : "json",
    }),
  exportFinance: (format) =>
    api.get("/admin/export/finance", {
      params: { format },
      responseType: format === "csv" ? "blob" : "json",
    }),
};
