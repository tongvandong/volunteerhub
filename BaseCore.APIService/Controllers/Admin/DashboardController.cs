using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly MySqlDbContext _context;

        public DashboardController(MySqlDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (role == "Admin")
            {
                var totalUsers = await _context.Users.CountAsync();
                var pendingEvents = await _context.Events.CountAsync(e => e.Status == "Pending");
                var totalEvents = await _context.Events.CountAsync();
                var totalRegistrations = await _context.Registrations.CountAsync();
                var totalCertificates = await _context.Certificates.CountAsync();
                return Ok(new { totalUsers, pendingEvents, totalEvents, totalRegistrations, totalCertificates });
            }
            else if (role == "Organizer")
            {
                var myEvents = await _context.Events.Where(e => e.OrganizerId == userId).ToListAsync();
                var eventIds = myEvents.Select(e => e.Id).ToList();
                var pendingRegistrations = await _context.Registrations
                    .CountAsync(r => eventIds.Contains(r.EventId) && r.Status == "Pending");
                var totalVolunteers = await _context.Registrations
                    .CountAsync(r => eventIds.Contains(r.EventId) && r.Status == "Confirmed");
                return Ok(new
                {
                    totalEvents = myEvents.Count,
                    approvedEvents = myEvents.Count(e => e.Status == "Approved"),
                    completedEvents = myEvents.Count(e => e.Status == "Completed"),
                    pendingRegistrations,
                    totalVolunteers,
                    recentEvents = myEvents.OrderByDescending(e => e.CreatedAt).Take(5)
                });
            }
            else if (role == "Sponsor")
            {
                var mySponsors = await _context.EventSponsors
                    .Include(s => s.Event)
                    .Where(s => s.SponsorId == userId)
                    .OrderByDescending(s => s.SponsoredAt)
                    .ToListAsync();
                return Ok(new { totalSponsored = mySponsors.Count, sponsors = mySponsors });
            }
            else // Volunteer
            {
                var myRegistrations = await _context.Registrations
                    .Include(r => r.Event)
                    .Where(r => r.UserId == userId)
                    .ToListAsync();
                var profile = await _context.VolunteerProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
                var myBadges = await _context.UserBadges
                    .Include(ub => ub.Badge)
                    .Where(ub => ub.UserId == userId)
                    .OrderByDescending(ub => ub.AwardedAt)
                    .Take(5)
                    .ToListAsync();
                var upcomingEvents = await _context.Events
                    .Where(e => e.Status == "Approved" && e.StartDate > DateTime.UtcNow)
                    .OrderBy(e => e.StartDate)
                    .Take(5)
                    .ToListAsync();
                return Ok(new
                {
                    totalRegistrations = myRegistrations.Count,
                    attendedEvents = myRegistrations.Count(r => r.IsAttended),
                    totalHours = profile?.TotalVolunteerHours ?? 0,
                    recentBadges = myBadges,
                    upcomingEvents
                });
            }
        }

        [HttpGet("organizer-insights")]
        [Authorize(Roles = "Organizer")]
        public async Task<IActionResult> GetOrganizerInsights(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int? eventId,
            [FromQuery] int? categoryId,
            [FromQuery] string? status)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var baseEvents = await _context.Events
                .Include(e => e.Category)
                .Where(e => e.OrganizerId == userId)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            var filteredEvents = baseEvents
                .Where(e => !from.HasValue || e.StartDate.Date >= from.Value.Date)
                .Where(e => !to.HasValue || e.StartDate.Date <= to.Value.Date)
                .Where(e => !eventId.HasValue || e.Id == eventId.Value)
                .Where(e => !categoryId.HasValue || e.CategoryId == categoryId.Value)
                .Where(e => string.IsNullOrWhiteSpace(status) || e.Status == status)
                .ToList();

            var eventIds = filteredEvents.Select(e => e.Id).ToList();

            var registrations = eventIds.Count == 0
                ? new List<BaseCore.Entities.Registration>()
                : await _context.Registrations.Where(r => eventIds.Contains(r.EventId)).ToListAsync();

            var certificates = eventIds.Count == 0
                ? new List<BaseCore.Entities.Certificate>()
                : await _context.Certificates.Where(c => eventIds.Contains(c.EventId)).ToListAsync();

            var campaigns = eventIds.Count == 0
                ? new List<BaseCore.Entities.SupportCampaign>()
                : await _context.SupportCampaigns.Where(c => eventIds.Contains(c.EventId)).ToListAsync();

            var campaignIds = campaigns.Select(c => c.Id).ToList();
            var campaignEventMap = campaigns.ToDictionary(c => c.Id, c => c.EventId);
            var donations = campaignIds.Count == 0
                ? new List<BaseCore.Entities.IndividualDonation>()
                : await _context.IndividualDonations.Where(d => campaignIds.Contains(d.CampaignId)).ToListAsync();

            var proposals = eventIds.Count == 0
                ? new List<BaseCore.Entities.SponsorshipProposal>()
                : await _context.SponsorshipProposals.Where(p => eventIds.Contains(p.EventId)).ToListAsync();

            var confirmedDonations = donations.Where(d => d.Status == "Confirmed").ToList();
            var receivedProposals = proposals.Where(p => p.Status == "Received" || p.Status == "Reported").ToList();
            var donationAmount = confirmedDonations.Sum(d => d.Amount);
            var sponsorshipAmount = receivedProposals.Sum(GetProposalAmount);
            var confirmedRegistrations = registrations.Where(r => r.Status == "Confirmed").ToList();
            var attendedRegistrations = registrations.Where(r => r.IsAttended).ToList();
            var totalConfirmed = confirmedRegistrations.Count;

            var totals = new
            {
                events = filteredEvents.Count,
                approvedEvents = filteredEvents.Count(e => e.Status == "Approved"),
                completedEvents = filteredEvents.Count(e => e.Status == "Completed"),
                pendingEvents = filteredEvents.Count(e => e.Status == "Pending"),
                rejectedEvents = filteredEvents.Count(e => e.Status == "Rejected"),
                registrations = registrations.Count,
                pendingRegistrations = registrations.Count(r => r.Status == "Pending"),
                confirmedRegistrations = totalConfirmed,
                cancelledRegistrations = registrations.Count(r => r.Status == "Cancelled"),
                attendedVolunteers = attendedRegistrations.Count,
                volunteerHours = attendedRegistrations.Sum(r => r.VolunteerHours),
                certificatesIssued = certificates.Count,
                donationConfirmedAmount = donationAmount,
                donationConfirmedCount = confirmedDonations.Count,
                sponsorshipReceivedAmount = sponsorshipAmount,
                sponsorshipReceivedCount = receivedProposals.Count,
                financialConfirmedAmount = donationAmount + sponsorshipAmount,
                confirmationRate = SafeRate(totalConfirmed, registrations.Count),
                attendanceRate = SafeRate(attendedRegistrations.Count, totalConfirmed)
            };

            var financialByEvent = filteredEvents.Select(e =>
            {
                var eventDonationAmount = confirmedDonations
                    .Where(d => campaignEventMap.TryGetValue(d.CampaignId, out var mappedEventId) && mappedEventId == e.Id)
                    .Sum(d => d.Amount);
                var eventSponsorshipAmount = receivedProposals
                    .Where(p => p.EventId == e.Id)
                    .Sum(GetProposalAmount);

                return new
                {
                    e.Id,
                    e.Title,
                    e.Status,
                    donationAmount = eventDonationAmount,
                    sponsorshipAmount = eventSponsorshipAmount,
                    totalAmount = eventDonationAmount + eventSponsorshipAmount
                };
            })
            .OrderByDescending(e => e.totalAmount)
            .Take(8)
            .ToList();

            var topEventsByVolunteers = filteredEvents.Select(e =>
            {
                var eventRegs = registrations.Where(r => r.EventId == e.Id).ToList();
                var eventConfirmed = eventRegs.Count(r => r.Status == "Confirmed");
                var eventAttended = eventRegs.Count(r => r.IsAttended);

                return new
                {
                    e.Id,
                    e.Title,
                    e.Status,
                    e.StartDate,
                    e.MaxParticipants,
                    confirmed = eventConfirmed,
                    attended = eventAttended,
                    attendanceRate = SafeRate(eventAttended, eventConfirmed)
                };
            })
            .OrderByDescending(e => e.attended)
            .ThenByDescending(e => e.confirmed)
            .Take(8)
            .ToList();

            var topEventsByHours = filteredEvents.Select(e => new
            {
                e.Id,
                e.Title,
                e.Status,
                hours = registrations.Where(r => r.EventId == e.Id && r.IsAttended).Sum(r => r.VolunteerHours),
                certificates = certificates.Count(c => c.EventId == e.Id)
            })
            .OrderByDescending(e => e.hours)
            .Take(8)
            .ToList();

            var statusBreakdown = filteredEvents
                .GroupBy(e => e.Status)
                .Select(g => new { status = g.Key, count = g.Count() })
                .OrderByDescending(x => x.count)
                .ToList();

            var categoryBreakdown = filteredEvents
                .GroupBy(e => e.Category?.Name ?? "Chưa phân loại")
                .Select(g => new { category = g.Key, count = g.Count() })
                .OrderByDescending(x => x.count)
                .ToList();

            var recentEvents = filteredEvents
                .OrderByDescending(e => e.CreatedAt)
                .Take(6)
                .Select(e => new
                {
                    e.Id,
                    e.Title,
                    e.Status,
                    e.StartDate,
                    e.CreatedAt,
                    category = e.Category?.Name ?? "Chưa phân loại"
                })
                .ToList();

            return Ok(new
            {
                filters = new
                {
                    events = baseEvents.Select(e => new
                    {
                        e.Id,
                        e.Title,
                        e.Status,
                        e.CategoryId,
                        e.StartDate
                    }),
                    categories = baseEvents
                        .Where(e => e.Category != null)
                        .GroupBy(e => new { e.Category.Id, e.Category.Name })
                        .Select(g => new { g.Key.Id, g.Key.Name })
                        .OrderBy(c => c.Name),
                    statuses = baseEvents.Select(e => e.Status).Distinct().OrderBy(s => s)
                },
                totals,
                funnel = new
                {
                    registrations = registrations.Count,
                    confirmed = totalConfirmed,
                    attended = attendedRegistrations.Count,
                    certificates = certificates.Count
                },
                financialByEvent,
                topEventsByVolunteers,
                topEventsByHours,
                statusBreakdown,
                categoryBreakdown,
                recentEvents
            });
        }

        private static decimal GetProposalAmount(BaseCore.Entities.SponsorshipProposal proposal)
        {
            return proposal.Type == "OrganizerRequest"
                ? proposal.RequestedAmount ?? 0
                : proposal.OfferedAmount ?? proposal.RequestedAmount ?? 0;
        }

        private static decimal SafeRate(int numerator, int denominator)
        {
            return denominator == 0 ? 0 : Math.Round((decimal)numerator * 100 / denominator, 1);
        }
    }
}
