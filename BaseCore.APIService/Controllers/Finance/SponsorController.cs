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

        [HttpGet("api/events/{eventId}/sponsor-milestones"), Authorize(Roles = "Organizer,Admin,Sponsor")]
        public async Task<IActionResult> GetMilestones(int eventId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (!await CanReadMilestonesAsync(ev, userId)) return Forbid();

            var milestones = await GetMilestonesForEvent(eventId).ToListAsync();
            return Ok(milestones);
        }

        [HttpPost("api/events/{eventId}/sponsor-milestones"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> CreateMilestone(int eventId, [FromBody] SponsorProjectMilestoneDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (!CanWriteMilestones(ev, userId)) return Forbid();

            var validation = ValidateMilestone(dto);
            if (validation != null) return BadRequest(new { message = validation });

            var milestone = new SponsorProjectMilestone
            {
                EventId = eventId,
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim() ?? "",
                DueDate = dto.DueDate,
                Status = NormalizeMilestoneStatus(dto.Status),
                ProgressPercent = ClampProgress(dto.ProgressPercent),
                SortOrder = dto.SortOrder,
                CreatedAtUtc = DateTime.UtcNow
            };
            ApplyCompletionFields(milestone);

            _context.SponsorProjectMilestones.Add(milestone);
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SponsorMilestone.Create", "SponsorProjectMilestone", milestone.Id, $"EventId={eventId};Title={milestone.Title}");

            return Ok(milestone);
        }

        [HttpPut("api/events/{eventId}/sponsor-milestones/{milestoneId}"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> UpdateMilestone(int eventId, int milestoneId, [FromBody] SponsorProjectMilestoneDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (!CanWriteMilestones(ev, userId)) return Forbid();

            var milestone = await _context.SponsorProjectMilestones
                .FirstOrDefaultAsync(m => m.Id == milestoneId && m.EventId == eventId);
            if (milestone == null) return NotFound(new { message = "Milestone not found" });

            var validation = ValidateMilestone(dto);
            if (validation != null) return BadRequest(new { message = validation });

            milestone.Title = dto.Title.Trim();
            milestone.Description = dto.Description?.Trim() ?? "";
            milestone.DueDate = dto.DueDate;
            milestone.Status = NormalizeMilestoneStatus(dto.Status);
            milestone.ProgressPercent = ClampProgress(dto.ProgressPercent);
            milestone.SortOrder = dto.SortOrder;
            milestone.UpdatedAtUtc = DateTime.UtcNow;
            ApplyCompletionFields(milestone);

            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SponsorMilestone.Update", "SponsorProjectMilestone", milestone.Id, $"EventId={eventId};Status={milestone.Status};Progress={milestone.ProgressPercent}");

            return Ok(milestone);
        }

        [HttpDelete("api/events/{eventId}/sponsor-milestones/{milestoneId}"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> DeleteMilestone(int eventId, int milestoneId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (!CanWriteMilestones(ev, userId)) return Forbid();

            var milestone = await _context.SponsorProjectMilestones
                .FirstOrDefaultAsync(m => m.Id == milestoneId && m.EventId == eventId);
            if (milestone == null) return NotFound(new { message = "Milestone not found" });

            _context.SponsorProjectMilestones.Remove(milestone);
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SponsorMilestone.Delete", "SponsorProjectMilestone", milestoneId, $"EventId={eventId}");

            return Ok(new { message = "Deleted" });
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
            var milestones = await GetMilestonesForEvent(eventId).ToListAsync();
            var ev = sponsorship.Event;

            var completedMilestones = milestones.Count(m => m.Status == "Completed" || m.ProgressPercent >= 100);
            var projectProgress = milestones.Count > 0
                ? (int)Math.Round(milestones.Average(m => ClampProgress(m.ProgressPercent)))
                : CalculateFallbackProgress(ev, registrations, certificatesIssued);
            var timeline = milestones.Count > 0
                ? milestones.Select(m => new
                {
                    title = m.Title,
                    date = m.CompletedAtUtc ?? m.DueDate ?? m.CreatedAtUtc,
                    status = MapMilestoneStatusForTimeline(m),
                    description = m.Description,
                    progressPercent = m.ProgressPercent
                }).Cast<object>().ToList()
                : BuildFallbackTimeline(ev, sponsorship);

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
                    sponsorAmount = sponsors.Sum(s => s.Amount),
                    projectProgress,
                    milestoneCount = milestones.Count,
                    completedMilestones
                },
                timeline
            });
        }

        private IQueryable<SponsorProjectMilestone> GetMilestonesForEvent(int eventId)
        {
            return _context.SponsorProjectMilestones
                .Where(m => m.EventId == eventId)
                .OrderBy(m => m.SortOrder)
                .ThenBy(m => m.DueDate)
                .ThenBy(m => m.Id);
        }

        private async Task<bool> CanReadMilestonesAsync(Entities.Event ev, int userId)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "Admin" || ev.OrganizerId == userId) return true;
            if (role == "Sponsor")
            {
                return await _context.EventSponsors.AnyAsync(s => s.EventId == ev.Id && s.SponsorId == userId);
            }

            return false;
        }

        private bool CanWriteMilestones(Entities.Event ev, int userId)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return role == "Admin" || ev.OrganizerId == userId;
        }

        private static string? ValidateMilestone(SponsorProjectMilestoneDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return "Milestone title is required";
            if (dto.Title.Trim().Length > 200)
                return "Milestone title is too long";
            if ((dto.Description?.Length ?? 0) > 1000)
                return "Milestone description is too long";
            if (dto.ProgressPercent < 0 || dto.ProgressPercent > 100)
                return "Progress percent must be between 0 and 100";
            if (dto.SortOrder < 0)
                return "Milestone sort order must be zero or greater";

            return null;
        }

        private static string NormalizeMilestoneStatus(string? status)
        {
            return status?.Trim() switch
            {
                "InProgress" => "InProgress",
                "Completed" => "Completed",
                "Blocked" => "Blocked",
                _ => "Planned"
            };
        }

        private static void ApplyCompletionFields(SponsorProjectMilestone milestone)
        {
            if (milestone.Status == "Completed" || milestone.ProgressPercent >= 100)
            {
                milestone.Status = "Completed";
                milestone.ProgressPercent = 100;
                milestone.CompletedAtUtc ??= DateTime.UtcNow;
            }
            else
            {
                milestone.CompletedAtUtc = null;
            }
        }

        private static int ClampProgress(int progress)
        {
            return Math.Min(100, Math.Max(0, progress));
        }

        private static string MapMilestoneStatusForTimeline(SponsorProjectMilestone milestone)
        {
            if (milestone.Status == "Completed" || milestone.ProgressPercent >= 100) return "Done";
            if (milestone.Status == "InProgress") return "InProgress";
            if (milestone.Status == "Blocked") return "Blocked";
            return "Pending";
        }

        private static int CalculateFallbackProgress(Entities.Event ev, List<Registration> registrations, int certificatesIssued)
        {
            if (ev.Status == "Completed") return 100;
            if (registrations.Any(r => r.IsAttended) || certificatesIssued > 0) return 75;
            if (DateTime.UtcNow >= ev.StartDate) return 60;
            if (ev.Status == "Approved") return 35;
            return 10;
        }

        private static List<object> BuildFallbackTimeline(Entities.Event ev, EventSponsor sponsorship)
        {
            var timeline = new List<object>
            {
                new
                {
                    title = "Event created",
                    date = ev.CreatedAt,
                    status = "Done",
                    description = "Organizer submitted the event to VolunteerHub.",
                    progressPercent = 10
                },
                new
                {
                    title = "Sponsorship recorded",
                    date = sponsorship.SponsoredAt,
                    status = "Done",
                    description = $"{sponsorship.ContributionType} - {sponsorship.Amount:0.##} VND",
                    progressPercent = 35
                }
            };

            if (ev.Status is "Approved" or "Completed")
            {
                timeline.Add(new
                {
                    title = "Event approved",
                    date = ev.CreatedAt,
                    status = "Done",
                    description = "Event is public and open for registration.",
                    progressPercent = 50
                });
            }

            timeline.Add(new
            {
                title = "Event delivery",
                date = ev.StartDate,
                status = DateTime.UtcNow >= ev.StartDate || ev.Status == "Completed" ? "Done" : "Pending",
                description = $"{ev.Location} - {ev.StartDate:dd/MM/yyyy HH:mm}",
                progressPercent = ev.Status == "Completed" ? 100 : 75
            });

            return timeline;
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

    public class SponsorProjectMilestoneDto
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Status { get; set; }
        public int ProgressPercent { get; set; }
        public int SortOrder { get; set; }
    }
}
