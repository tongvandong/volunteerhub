using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using BaseCore.Services.VolunteerHub;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    public class SponsorController : ControllerBase
    {
        private readonly IEventSponsorRepositoryEF _sponsorRepo;
        private readonly MySqlDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public SponsorController(
            IEventSponsorRepositoryEF sponsorRepo,
            MySqlDbContext context,
            IAuditLogService auditLogService)
        {
            _sponsorRepo = sponsorRepo;
            _context = context;
            _auditLogService = auditLogService;
        }

        [HttpGet("api/events/{eventId}/sponsors")]
        public async Task<IActionResult> GetSponsors(int eventId)
        {
            var sponsors = await _sponsorRepo.GetByEventAsync(eventId);
            return Ok(sponsors);
        }

        [HttpPost("api/events/{eventId}/sponsors"), Authorize(Roles = "Sponsor")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> AddSponsor(int eventId, [FromBody] SponsorDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            if (dto.Amount <= 0)
                return BadRequest(new { message = "Sponsor amount must be greater than zero" });

            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (ev.Status != "Approved") return BadRequest(new { message = "Only approved events can be sponsored" });

            var sponsor = new EventSponsor
            {
                EventId = eventId,
                SponsorId = userId,
                ContributionType = string.IsNullOrWhiteSpace(dto.ContributionType) ? "Financial" : dto.ContributionType.Trim(),
                Amount = dto.Amount,
                Note = dto.Note ?? "",
                SponsoredAt = DateTime.UtcNow
            };
            await _sponsorRepo.AddAsync(sponsor);
            await RecordAuditAsync(userId, "Sponsor.Add", "EventSponsor", sponsor.Id, $"EventId={eventId};Amount={sponsor.Amount:0.##}");
            return Ok(sponsor);
        }

        [HttpGet("api/sponsors/my"), Authorize(Roles = "Sponsor")]
        public async Task<IActionResult> GetMySponsorships()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var sponsors = await _sponsorRepo.GetBySponsorAsync(userId);
            return Ok(sponsors);
        }

        [HttpGet("api/sponsors/my/{sponsorshipId}/tracking"), Authorize(Roles = "Sponsor")]
        public async Task<IActionResult> GetMySponsorshipTracking(int sponsorshipId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var sponsorship = await _context.EventSponsors
                .Include(s => s.Event).ThenInclude(e => e.Category)
                .Include(s => s.Event).ThenInclude(e => e.Organizer)
                .FirstOrDefaultAsync(s => s.Id == sponsorshipId && s.SponsorId == userId);

            if (sponsorship == null)
                return NotFound(new { message = "Sponsorship not found" });

            var eventId = sponsorship.EventId;
            var registrations = await _context.Registrations
                .Where(r => r.EventId == eventId)
                .ToListAsync();
            var certificatesIssued = await _context.Certificates.CountAsync(c => c.EventId == eventId);
            var sponsors = await _context.EventSponsors
                .Where(s => s.EventId == eventId)
                .ToListAsync();
            var ev = sponsorship.Event;

            var timeline = new List<object>
            {
                new
                {
                    title = "Sự kiện được tạo",
                    date = ev.CreatedAt,
                    status = "Done",
                    description = "Ban tổ chức đã gửi sự kiện lên VolunteerHub."
                },
                new
                {
                    title = "Tài trợ được ghi nhận",
                    date = sponsorship.SponsoredAt,
                    status = "Done",
                    description = $"{sponsorship.ContributionType} - {sponsorship.Amount:0.##} VNĐ"
                }
            };

            if (ev.Status is "Approved" or "Completed")
            {
                timeline.Add(new
                {
                    title = "Sự kiện đã được duyệt",
                    date = ev.CreatedAt,
                    status = "Done",
                    description = "Sự kiện đủ điều kiện công khai và nhận đăng ký."
                });
            }

            timeline.Add(new
            {
                title = "Diễn ra sự kiện",
                date = ev.StartDate,
                status = DateTime.UtcNow >= ev.StartDate || ev.Status == "Completed" ? "Done" : "Upcoming",
                description = $"{ev.Location} - {ev.StartDate:dd/MM/yyyy HH:mm}"
            });

            timeline.Add(new
            {
                title = "Tổng kết tác động",
                date = ev.EndDate,
                status = ev.Status == "Completed" ? "Done" : "Pending",
                description = ev.Status == "Completed"
                    ? "Sự kiện đã hoàn thành và tác động đã được ghi nhận."
                    : "Tác động sẽ được cập nhật khi sự kiện hoàn thành."
            });

            return Ok(new
            {
                sponsorship,
                eventInfo = new
                {
                    ev.Id,
                    ev.Title,
                    ev.Status,
                    ev.Location,
                    ev.StartDate,
                    ev.EndDate,
                    category = ev.Category?.Name ?? "",
                    organizer = ev.Organizer?.Name ?? ""
                },
                impact = new
                {
                    totalRegistrations = registrations.Count,
                    confirmedRegistrations = registrations.Count(r => r.Status == "Confirmed"),
                    attendedVolunteers = registrations.Count(r => r.IsAttended),
                    totalVolunteerHours = registrations.Where(r => r.IsAttended).Sum(r => r.VolunteerHours),
                    certificatesIssued,
                    sponsorCount = sponsors.Count,
                    sponsorAmount = sponsors.Sum(s => s.Amount)
                },
                timeline
            });
        }

        private Task RecordAuditAsync(int? userId, string action, string entityType, int? entityId = null, string? metadata = null)
        {
            return _auditLogService.RecordAsync(
                userId,
                action,
                entityType,
                entityId,
                metadata,
                HttpContext.Connection.RemoteIpAddress?.ToString());
        }
    }

    public class SponsorDto
    {
        public string ContributionType { get; set; } = "Financial";
        public decimal Amount { get; set; }
        public string? Note { get; set; }
    }
}
