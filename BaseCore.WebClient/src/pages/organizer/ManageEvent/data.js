import { eventApi, sponsorshipProposalApi, supportCampaignApi } from '../../../services/api';

export async function loadManageEventData(eventId) {
  const results = await Promise.all([
    eventApi.getById(eventId),
    eventApi.getRegistrations(eventId),
    eventApi.getShifts(eventId),
    supportCampaignApi.getByEvent(eventId).catch(() => ({ data: [] })),
    sponsorshipProposalApi.getByEvent(eventId).catch(() => ({ data: [] })),
    sponsorshipProposalApi.getSponsorUsers().catch(() => ({ data: [] })),
    eventApi.getEventHistory(eventId).catch(() => ({ data: [] })),
  ]);

  return {
    event: results[0].data,
    registrations: results[1].data || [],
    shifts: results[2].data || [],
    campaigns: results[3].data || [],
    proposals: results[4].data || [],
    sponsorUsers: results[5].data || [],
    history: results[6].data || [],
  };
}
