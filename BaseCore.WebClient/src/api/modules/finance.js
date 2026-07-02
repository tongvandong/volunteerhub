import api from "../httpClient";

export const sponsorApi = {
  getByEvent: (eventId) => api.get(`/events/${eventId}/sponsors`),
  addSponsor: (eventId, data) =>
    api.post(`/events/${eventId}/sponsors`, data),
  getMySponsorships: () => api.get("/sponsors/my"),
};

export const supportCampaignApi = {
  getByEvent: (eventId) =>
    api.get(`/events/${eventId}/support-campaigns`),
  getById: (campaignId) => api.get(`/support-campaigns/${campaignId}`),
  create: (eventId, data) =>
    api.post(`/events/${eventId}/support-campaigns`, data),
  update: (campaignId, data) =>
    api.put(`/support-campaigns/${campaignId}`, data),
  open: (campaignId) => api.put(`/support-campaigns/${campaignId}/open`),
  close: (campaignId) => api.put(`/support-campaigns/${campaignId}/close`),
  cancel: (campaignId) => api.put(`/support-campaigns/${campaignId}/cancel`),
  report: (campaignId, data) =>
    api.post(`/support-campaigns/${campaignId}/report`, data),
  getDonations: (campaignId) =>
    api.get(`/support-campaigns/${campaignId}/donations`),
  donate: (campaignId, data) =>
    api.post(`/support-campaigns/${campaignId}/donations`, data),
  getMyDonations: () => api.get("/donations/my"),
  confirmDonation: (donationId) =>
    api.put(`/donations/${donationId}/confirm`),
  rejectDonation: (donationId, data = {}) =>
    api.put(`/donations/${donationId}/reject`, data),
  cancelDonation: (donationId) => api.put(`/donations/${donationId}/cancel`),
};

export const sponsorshipProposalApi = {
  getSponsorUsers: () => api.get("/sponsors/users"),
  getByEvent: (eventId) =>
    api.get(`/events/${eventId}/sponsorship-proposals`),
  getMy: () => api.get("/sponsorship-proposals/my"),
  organizerRequest: (eventId, data) =>
    api.post(
      `/events/${eventId}/sponsorship-proposals/organizer-request`,
      data,
    ),
  sponsorOffer: (eventId, data) =>
    api.post(`/events/${eventId}/sponsorship-proposals/sponsor-offer`, data),
  accept: (proposalId, data = {}) =>
    api.put(`/sponsorship-proposals/${proposalId}/accept`, data),
  reject: (proposalId, data = {}) =>
    api.put(`/sponsorship-proposals/${proposalId}/reject`, data),
  received: (proposalId, data) =>
    api.put(`/sponsorship-proposals/${proposalId}/received`, data),
  cancel: (proposalId) =>
    api.put(`/sponsorship-proposals/${proposalId}/cancel`),
  report: (proposalId, data) =>
    api.post(`/sponsorship-proposals/${proposalId}/report`, data),
};
