using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BaseCore.Repository;
using BaseCore.Services.VolunteerHub;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;

namespace BaseCore.APIService.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly MySqlDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public AdminController(MySqlDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? keyword, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.Users.AsQueryable();
            if (!string.IsNullOrEmpty(keyword))
                query = query.Where(u => u.UserName.Contains(keyword) || u.Name.Contains(keyword) || u.Email.Contains(keyword));

            var total = await query.CountAsync();
            var users = await query.OrderByDescending(u => u.Id)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(u => new { u.Id, u.UserName, u.Name, u.Email, u.UserType, u.IsActive })
                .ToListAsync();

            return Ok(new { items = users, totalCount = total, page, pageSize, totalPages = (int)Math.Ceiling((double)total / pageSize) });
        }

        [HttpPut("users/{id}/toggle-status")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();
            await RecordAuditAsync("Admin.User.ToggleStatus", "User", user.Id, $"IsActive={user.IsActive}");

            // Impact summary when deactivating — non-destructive; the admin decides next steps.
            object? impact = null;
            if (!user.IsActive)
            {
                if (user.UserType == 1) // Organizer
                {
                    impact = new
                    {
                        role = "Organizer",
                        activeEvents = await _context.Events.CountAsync(e => e.OrganizerId == id && (e.Status == "Pending" || e.Status == "Approved")),
                        openCampaigns = await _context.SupportCampaigns.CountAsync(c => c.Event.OrganizerId == id && c.Status == "Open"),
                        openProposals = await _context.SponsorshipProposals.CountAsync(p => p.OrganizerId == id && (p.Status == "Pending" || p.Status == "Accepted"))
                    };
                }
                else if (user.UserType == 2) // Sponsor
                {
                    impact = new
                    {
                        role = "Sponsor",
                        openProposals = await _context.SponsorshipProposals.CountAsync(p => p.SponsorId == id && (p.Status == "Pending" || p.Status == "Accepted"))
                    };
                }
                else if (user.UserType == 0) // Volunteer
                {
                    impact = new
                    {
                        role = "Volunteer",
                        activeRegistrations = await _context.Registrations.CountAsync(r => r.UserId == id && (r.Status == "Pending" || r.Status == "Confirmed") && !r.IsAttended),
                        pendingDonations = await _context.IndividualDonations.CountAsync(d => d.UserId == id && d.Status == "PendingConfirmation")
                    };
                }
            }

            return Ok(new { id = user.Id, isActive = user.IsActive, impact });
        }

        [HttpGet("volunteer-kyc")]
        public async Task<IActionResult> GetVolunteerKycRequests([FromQuery] string? status = "PendingVerification")
        {
            var query = _context.VolunteerProfiles
                .Include(p => p.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(p => p.KycStatus == status);

            var items = await query
                .OrderByDescending(p => p.KycSubmittedAt ?? DateTime.MinValue)
                .Select(p => new
                {
                    p.Id,
                    p.UserId,
                    VolunteerName = p.User != null ? p.User.Name : "",
                    VolunteerEmail = p.User != null ? p.User.Email : "",
                    p.KycStatus,
                    p.IdentityFrontImageUrl,
                    p.IdentityBackImageUrl,
                    p.PortraitImageUrl,
                    p.KycSubmittedAt,
                    p.KycReviewedAt,
                    p.KycReviewedBy,
                    p.KycAdminNote
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPut("volunteer-kyc/{profileId}/approve")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> ApproveVolunteerKyc(int profileId, [FromBody] AdminReviewDto? dto = null)
        {
            var profile = await _context.VolunteerProfiles.FindAsync(profileId);
            if (profile == null) return NotFound();

            profile.KycStatus = "Verified";
            profile.KycReviewedAt = DateTime.UtcNow;
            profile.KycReviewedBy = GetCurrentUserId();
            profile.KycAdminNote = dto?.Note ?? "";

            await _context.SaveChangesAsync();
            await RecordAuditAsync("Admin.VolunteerKyc.Approve", "VolunteerProfile", profile.Id, dto?.Note);
            return Ok(profile);
        }

        [HttpPut("volunteer-kyc/{profileId}/reject")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> RejectVolunteerKyc(int profileId, [FromBody] AdminReviewDto? dto = null)
        {
            var profile = await _context.VolunteerProfiles.FindAsync(profileId);
            if (profile == null) return NotFound();

            profile.KycStatus = "Rejected";
            profile.KycReviewedAt = DateTime.UtcNow;
            profile.KycReviewedBy = GetCurrentUserId();
            profile.KycAdminNote = dto?.Note ?? "";

            await _context.SaveChangesAsync();
            await RecordAuditAsync("Admin.VolunteerKyc.Reject", "VolunteerProfile", profile.Id, dto?.Note);
            return Ok(profile);
        }

        [HttpGet("volunteer-skill-verifications")]
        public async Task<IActionResult> GetVolunteerSkillVerifications([FromQuery] string? status = "PendingVerification")
        {
            var query = _context.VolunteerSkills
                .Include(vs => vs.User)
                .Include(vs => vs.Skill)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(vs => vs.VerificationStatus == status);

            var items = await query
                .OrderByDescending(vs => vs.VerificationSubmittedAt ?? DateTime.MinValue)
                .Select(vs => new
                {
                    vs.Id,
                    vs.UserId,
                    VolunteerName = vs.User != null ? vs.User.Name : "",
                    VolunteerEmail = vs.User != null ? vs.User.Email : "",
                    SkillName = vs.Skill != null ? vs.Skill.Name : "",
                    SkillCategory = vs.Skill != null ? vs.Skill.Category : "",
                    vs.Level,
                    vs.VerificationStatus,
                    vs.EvidenceUrl,
                    vs.VerificationNote,
                    vs.VerificationSubmittedAt,
                    vs.VerificationReviewedAt,
                    vs.VerificationReviewedBy,
                    vs.AdminNote
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPut("volunteer-skill-verifications/{id}/approve")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> ApproveVolunteerSkill(int id, [FromBody] AdminReviewDto? dto = null)
        {
            var volunteerSkill = await _context.VolunteerSkills.FindAsync(id);
            if (volunteerSkill == null) return NotFound();

            volunteerSkill.VerificationStatus = "Verified";
            volunteerSkill.VerificationReviewedAt = DateTime.UtcNow;
            volunteerSkill.VerificationReviewedBy = GetCurrentUserId();
            volunteerSkill.AdminNote = dto?.Note ?? "";

            await _context.SaveChangesAsync();
            await RecordAuditAsync("Admin.VolunteerSkill.Approve", "VolunteerSkill", volunteerSkill.Id, dto?.Note);
            return Ok(volunteerSkill);
        }

        [HttpPut("volunteer-skill-verifications/{id}/reject")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> RejectVolunteerSkill(int id, [FromBody] AdminReviewDto? dto = null)
        {
            var volunteerSkill = await _context.VolunteerSkills.FindAsync(id);
            if (volunteerSkill == null) return NotFound();

            volunteerSkill.VerificationStatus = "Rejected";
            volunteerSkill.VerificationReviewedAt = DateTime.UtcNow;
            volunteerSkill.VerificationReviewedBy = GetCurrentUserId();
            volunteerSkill.AdminNote = dto?.Note ?? "";

            await _context.SaveChangesAsync();
            await RecordAuditAsync("Admin.VolunteerSkill.Reject", "VolunteerSkill", volunteerSkill.Id, dto?.Note);
            return Ok(volunteerSkill);
        }

        [HttpGet("export/events")]
        [EnableRateLimiting("read-sensitive")]
        public async Task<IActionResult> ExportEvents([FromQuery] string format = "json")
        {
            var events = await _context.Events
                .Include(e => e.Category)
                .Include(e => e.Organizer)
                .Select(e => new
                {
                    e.Id, e.Title, e.Status, e.Location,
                    e.StartDate, e.EndDate, e.MinParticipants, e.MaxParticipants, e.CurrentParticipants,
                    Category = e.Category != null ? e.Category.Name : "",
                    Organizer = e.Organizer != null ? e.Organizer.Name : "",
                    e.CreatedAt
                })
                .ToListAsync();

            if (format.ToLower() == "csv")
            {
                await RecordAuditAsync("Admin.Export.Events", "Event", null, "Format=csv");
                var csv = new StringBuilder();
                csv.AppendLine("Id,Title,Status,Location,StartDate,EndDate,MinParticipants,MaxParticipants,CurrentParticipants,Category,Organizer,CreatedAt");
                foreach (var e in events)
                    csv.AppendLine($"{e.Id},{EscapeCsv(e.Title)},{e.Status},{EscapeCsv(e.Location)},{e.StartDate:yyyy-MM-dd},{e.EndDate:yyyy-MM-dd},{e.MinParticipants},{e.MaxParticipants},{e.CurrentParticipants},{EscapeCsv(e.Category)},{EscapeCsv(e.Organizer)},{e.CreatedAt:yyyy-MM-dd}");
                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "events.csv");
            }

            await RecordAuditAsync("Admin.Export.Events", "Event", null, "Format=json");
            return Ok(events);
        }

        [HttpGet("export/users")]
        [EnableRateLimiting("read-sensitive")]
        public async Task<IActionResult> ExportUsers([FromQuery] string format = "json")
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.UserName, u.Name, u.Email, u.UserType, u.IsActive })
                .ToListAsync();

            if (format.ToLower() == "csv")
            {
                await RecordAuditAsync("Admin.Export.Users", "User", null, "Format=csv");
                var csv = new StringBuilder();
                csv.AppendLine("Id,Username,Name,Email,UserType,IsActive");
                foreach (var u in users)
                    csv.AppendLine($"{u.Id},{EscapeCsv(u.UserName)},{EscapeCsv(u.Name)},{EscapeCsv(u.Email)},{u.UserType},{u.IsActive}");
                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "users.csv");
            }

            await RecordAuditAsync("Admin.Export.Users", "User", null, "Format=json");
            return Ok(users);
        }

        [HttpGet("finance/overview")]
        public async Task<IActionResult> GetFinanceOverview()
        {
            var donationConfirmedAmount = await _context.IndividualDonations
                .Where(d => d.Status == "Confirmed")
                .SumAsync(d => (decimal?)d.Amount) ?? 0;
            var donationPendingAmount = await _context.IndividualDonations
                .Where(d => d.Status == "PendingConfirmation")
                .SumAsync(d => (decimal?)d.Amount) ?? 0;
            var sponsorshipReceivedAmount = await _context.SponsorshipProposals
                .Where(p => p.Status == "Received" || p.Status == "Reported")
                .SumAsync(p => p.ActualReceivedAmount ?? (p.Type == "OrganizerRequest" ? p.RequestedAmount ?? 0 : p.OfferedAmount ?? 0));

            return Ok(new
            {
                totals = new
                {
                    campaigns = await _context.SupportCampaigns.CountAsync(),
                    donations = await _context.IndividualDonations.CountAsync(),
                    proposals = await _context.SponsorshipProposals.CountAsync(),
                    donationConfirmedAmount,
                    donationPendingAmount,
                    sponsorshipReceivedAmount,
                    financialConfirmedAmount = donationConfirmedAmount + sponsorshipReceivedAmount
                },
                recentDonations = await _context.IndividualDonations
                    .Include(d => d.Campaign).ThenInclude(c => c.Event)
                    .OrderByDescending(d => d.CreatedAt)
                    .Take(10)
                    .Select(d => new { d.Id, d.Amount, d.Status, d.DisplayName, campaign = d.Campaign.Title, eventTitle = d.Campaign.Event.Title, d.CreatedAt })
                    .ToListAsync(),
                recentProposals = await _context.SponsorshipProposals
                    .Include(p => p.Event)
                    .Include(p => p.Sponsor)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(10)
                    .Select(p => new { p.Id, p.Title, p.Type, p.Status, sponsor = p.Sponsor.Name, eventTitle = p.Event.Title, amount = p.ActualReceivedAmount ?? (p.Type == "OrganizerRequest" ? p.RequestedAmount ?? 0 : p.OfferedAmount ?? 0), p.CreatedAt })
                    .ToListAsync()
            });
        }

        [HttpGet("finance/open-proposals-past-event")]
        public async Task<IActionResult> GetOpenProposalsPastEvent()
        {
            var items = await _context.SponsorshipProposals
                .AsNoTracking()
                .Include(p => p.Event)
                .Include(p => p.Sponsor)
                .Include(p => p.Organizer)
                .Where(p => (p.Status == "Pending" || p.Status == "Accepted")
                         && (p.Event.Status == "Completed" || p.Event.Status == "Cancelled"))
                .OrderBy(p => p.Event.EndDate)
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.Type,
                    p.Status,
                    p.EventId,
                    eventTitle = p.Event.Title,
                    eventStatus = p.Event.Status,
                    eventEndDate = p.Event.EndDate,
                    sponsorName = p.Sponsor.Name ?? p.Sponsor.UserName,
                    organizerName = p.Organizer.Name ?? p.Organizer.UserName,
                    amount = p.Type == "OrganizerRequest" ? p.RequestedAmount ?? 0 : p.OfferedAmount ?? 0,
                    daysSinceEnd = (int)(DateTime.UtcNow - p.Event.EndDate).TotalDays
                })
                .ToListAsync();
            return Ok(items);
        }

        [HttpGet("finance/stale-donations")]
        public async Task<IActionResult> GetStaleDonations([FromQuery] int days = 7)
        {
            if (days < 1) days = 7;
            var cutoff = DateTime.UtcNow.AddDays(-days);

            var items = await _context.IndividualDonations
                .AsNoTracking()
                .Include(d => d.Campaign).ThenInclude(c => c.Event).ThenInclude(e => e.Organizer)
                .Include(d => d.User)
                .Where(d => d.Status == "PendingConfirmation" && d.CreatedAt <= cutoff)
                .OrderBy(d => d.CreatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.CampaignId,
                    campaignTitle = d.Campaign.Title,
                    eventId = d.Campaign.EventId,
                    eventTitle = d.Campaign.Event.Title,
                    organizerId = d.Campaign.Event.OrganizerId,
                    organizerName = d.Campaign.Event.Organizer.Name ?? d.Campaign.Event.Organizer.UserName,
                    d.Amount,
                    donorName = d.IsAnonymous ? "Ẩn danh" : d.DisplayName,
                    donorUserId = d.UserId,
                    donorUserName = d.User.UserName,
                    d.CreatedAt,
                    ageInDays = (int)(DateTime.UtcNow - d.CreatedAt).TotalDays
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("finance/unreported-campaigns")]
        public async Task<IActionResult> GetUnreportedCampaigns()
        {
            var items = await _context.SupportCampaigns
                .AsNoTracking()
                .Include(c => c.Event)
                .Where(c => c.Status != "Cancelled" && c.Status != "Reported" && c.ReportedAt == null)
                .Where(c => c.Event.Status == "Completed" || c.Event.Status == "Cancelled")
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.EventId,
                    eventTitle = c.Event.Title,
                    eventStatus = c.Event.Status,
                    c.TargetAmount,
                    confirmedAmount = c.Donations.Where(d => d.Status == "Confirmed").Sum(d => (decimal?)d.Amount) ?? 0,
                    c.EndDate,
                    c.Status,
                    organizerId = c.Event.OrganizerId
                })
                .Where(x => x.confirmedAmount > 0)
                .OrderBy(x => x.EndDate)
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("export/finance")]
        [EnableRateLimiting("read-sensitive")]
        public async Task<IActionResult> ExportFinance([FromQuery] string format = "json")
        {
            var campaigns = await _context.SupportCampaigns
                .Include(c => c.Event)
                .Select(c => new
                {
                    Type = "Campaign",
                    c.Id,
                    Event = c.Event.Title,
                    c.Title,
                    Counterparty = "",
                    c.Status,
                    Amount = c.Donations.Where(d => d.Status == "Confirmed").Sum(d => (decimal?)d.Amount) ?? 0,
                    c.UsedAmount,
                    c.ReportSummary,
                    c.ReportedAt,
                    c.CreatedAt
                })
                .ToListAsync();
            var proposals = await _context.SponsorshipProposals
                .Include(p => p.Event)
                .Include(p => p.Sponsor)
                .Select(p => new
                {
                    Type = "Sponsorship",
                    p.Id,
                    Event = p.Event.Title,
                    p.Title,
                    Counterparty = p.Sponsor.Name,
                    p.Status,
                    Amount = p.ActualReceivedAmount ?? (p.Type == "OrganizerRequest" ? p.RequestedAmount ?? 0 : p.OfferedAmount ?? 0),
                    p.UsedAmount,
                    p.ReportSummary,
                    p.ReportedAt,
                    p.CreatedAt
                })
                .ToListAsync();
            var rows = campaigns.Concat(proposals).OrderByDescending(x => x.CreatedAt).ToList();

            if (format.ToLower() == "csv")
            {
                await RecordAuditAsync("Admin.Export.Finance", "Finance", null, "Format=csv");
                var csv = new StringBuilder();
                csv.AppendLine("Type,Id,Event,Title,Counterparty,Status,Amount,UsedAmount,ReportSummary,ReportedAt,CreatedAt");
                foreach (var row in rows)
                    csv.AppendLine($"{row.Type},{row.Id},{EscapeCsv(row.Event)},{EscapeCsv(row.Title)},{EscapeCsv(row.Counterparty)},{row.Status},{row.Amount},{row.UsedAmount},{EscapeCsv(row.ReportSummary)},{row.ReportedAt:yyyy-MM-dd},{row.CreatedAt:yyyy-MM-dd}");
                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "finance.csv");
            }

            await RecordAuditAsync("Admin.Export.Finance", "Finance", null, "Format=json");
            return Ok(rows);
        }

        private Task RecordAuditAsync(string action, string entityType, int? entityId = null, string? metadata = null)
        {
            var userId = GetCurrentUserId();

            return _auditLogService.RecordAsync(
                userId,
                action,
                entityType,
                entityId,
                metadata,
                HttpContext.Connection.RemoteIpAddress?.ToString());
        }

        private int? GetCurrentUserId()
        {
            return int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var parsedUserId)
                ? parsedUserId
                : (int?)null;
        }

        private static string EscapeCsv(string? value)
        {
            if (string.IsNullOrEmpty(value)) return "";
            if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
                return $"\"{value.Replace("\"", "\"\"")}\"";
            return value;
        }
    }

    public class AdminReviewDto
    {
        public string? Note { get; set; }
    }
}
