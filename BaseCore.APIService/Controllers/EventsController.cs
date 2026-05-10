using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Services.VolunteerHub;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/events")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IRegistrationService _registrationService;
        private readonly IAuditLogService _auditLogService;
        private readonly MySqlDbContext _context;

        public EventsController(
            IEventService eventService,
            IRegistrationService registrationService,
            IAuditLogService auditLogService,
            MySqlDbContext context)
        {
            _eventService = eventService;
            _registrationService = registrationService;
            _auditLogService = auditLogService;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword, [FromQuery] int? categoryId,
            [FromQuery] string? status, [FromQuery] DateTime? startDateFrom,
            [FromQuery] int? skillId, [FromQuery] string? location,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var (items, totalCount) = await _eventService.SearchAsync(keyword, categoryId, status, startDateFrom, page, pageSize, skillId, location);
            return Ok(new { items, totalCount, page, pageSize, totalPages = (int)Math.Ceiling((double)totalCount / pageSize) });
        }

        [HttpGet("my"), Authorize(Roles = "Organizer")]
        public async Task<IActionResult> GetMine()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var events = await _eventService.GetByOrganizerAsync(userId);
            return Ok(events);
        }

        [HttpGet("recommended"), Authorize]
        public async Task<IActionResult> GetRecommended()
        {
            if (!int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var events = await _eventService.GetRecommendedAsync(userId);
            return Ok(events);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ev = await _eventService.GetByIdAsync(id);
            return ev == null ? NotFound(new { message = "Event not found" }) : Ok(ev);
        }

        [HttpGet("{id}/impact")]
        public async Task<IActionResult> GetImpact(int id)
        {
            var ev = await _context.Events
                .Include(e => e.Category)
                .Include(e => e.Organizer)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (ev == null) return NotFound(new { message = "Event not found" });

            var registrations = await _context.Registrations
                .Where(r => r.EventId == id)
                .ToListAsync();
            var sponsors = await _context.EventSponsors
                .Where(s => s.EventId == id)
                .ToListAsync();
            var campaigns = await _context.SupportCampaigns
                .Where(c => c.EventId == id)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Status,
                    c.TargetAmount,
                    c.UsedAmount,
                    c.ReportSummary,
                    c.ReportedAt,
                    confirmedAmount = c.Donations.Where(d => d.Status == "Confirmed").Sum(d => (decimal?)d.Amount) ?? 0,
                    confirmedCount = c.Donations.Count(d => d.Status == "Confirmed")
                })
                .ToListAsync();
            var sponsorships = await _context.SponsorshipProposals
                .Include(p => p.Sponsor)
                .Where(p => p.EventId == id && (p.Status == "Received" || p.Status == "Reported"))
                .Select(p => new
                {
                    p.Id,
                    p.Title,
                    p.Status,
                    sponsorName = p.PublicSponsorName != "" ? p.PublicSponsorName : p.Sponsor.Name,
                    amount = p.Type == "OrganizerRequest" ? p.RequestedAmount ?? 0 : p.OfferedAmount ?? 0,
                    p.UsedAmount,
                    p.ReportSummary,
                    p.ReportedAt
                })
                .ToListAsync();
            var certificates = await _context.Certificates
                .CountAsync(c => c.EventId == id);
            var donationConfirmedAmount = campaigns.Sum(c => c.confirmedAmount);
            var sponsorshipReceivedAmount = sponsorships.Sum(s => s.amount);

            return Ok(new
            {
                eventId = id,
                title = ev.Title,
                status = ev.Status,
                organizer = ev.Organizer != null ? ev.Organizer.Name : "",
                category = ev.Category != null ? ev.Category.Name : "",
                totalRegistrations = registrations.Count,
                confirmedRegistrations = registrations.Count(r => r.Status == "Confirmed"),
                attendedVolunteers = registrations.Count(r => r.IsAttended),
                totalVolunteerHours = registrations.Where(r => r.IsAttended).Sum(r => r.VolunteerHours),
                certificatesIssued = certificates,
                sponsorCount = sponsors.Count,
                sponsorAmount = sponsors.Sum(s => s.Amount),
                donationConfirmedAmount,
                donationConfirmedCount = campaigns.Sum(c => c.confirmedCount),
                sponsorshipReceivedAmount,
                financialConfirmedAmount = donationConfirmedAmount + sponsorshipReceivedAmount,
                supportCampaigns = campaigns,
                receivedSponsorships = sponsorships
            });
        }

        [HttpPost, Authorize(Roles = "Organizer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Create([FromBody] EventCreateDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Event title is required" });
            if (string.IsNullOrWhiteSpace(dto.Location))
                return BadRequest(new { message = "Event location is required" });
            var coordinateError = ValidateCoordinates(dto.Latitude, dto.Longitude);
            if (coordinateError != null)
                return BadRequest(new { message = coordinateError });

            var ev = new Entities.Event
            {
                Title = dto.Title.Trim(), Description = dto.Description ?? "", Location = dto.Location ?? "",
                Latitude = dto.Latitude, Longitude = dto.Longitude,
                StartDate = dto.StartDate, EndDate = dto.EndDate,
                MaxParticipants = dto.MaxParticipants, CategoryId = dto.CategoryId,
                OrganizerId = userId, ImageUrl = dto.ImageUrl ?? "",
                RequiredSkillIds = dto.RequiredSkillIds ?? "[]"
            };
            await _eventService.CreateAsync(ev);
            await RecordAuditAsync(userId, "Event.Create", "Event", ev.Id, $"Title={ev.Title}");
            return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
        }

        [HttpPut("{id}"), Authorize(Roles = "Organizer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Update(int id, [FromBody] EventUpdateDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var ev = await _eventService.GetByIdAsync(id);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (ev.OrganizerId != userId) return Forbid();
            if (dto.Title != null && string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Event title cannot be empty" });
            var nextLatitude = dto.Latitude ?? ev.Latitude;
            var nextLongitude = dto.Longitude ?? ev.Longitude;
            var coordinateError = ValidateCoordinates(nextLatitude, nextLongitude);
            if (coordinateError != null)
                return BadRequest(new { message = coordinateError });

            ev.Title = dto.Title?.Trim() ?? ev.Title;
            ev.Description = dto.Description ?? ev.Description;
            ev.Location = dto.Location ?? ev.Location;
            ev.Latitude = nextLatitude;
            ev.Longitude = nextLongitude;
            ev.StartDate = dto.StartDate ?? ev.StartDate;
            ev.EndDate = dto.EndDate ?? ev.EndDate;
            ev.MaxParticipants = dto.MaxParticipants ?? ev.MaxParticipants;
            ev.CategoryId = dto.CategoryId ?? ev.CategoryId;
            ev.ImageUrl = dto.ImageUrl ?? ev.ImageUrl;
            ev.RequiredSkillIds = dto.RequiredSkillIds ?? ev.RequiredSkillIds;

            await _eventService.UpdateAsync(ev);
            await RecordAuditAsync(userId, "Event.Update", "Event", ev.Id, $"Status={ev.Status}");
            return Ok(ev);
        }

        [HttpDelete("{id}"), Authorize]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            var ev = await _eventService.GetByIdAsync(id);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (role != "Admin" && ev.OrganizerId != userId) return Forbid();

            await _eventService.DeleteAsync(id);
            await RecordAuditAsync(userId, "Event.Delete", "Event", id);
            return Ok(new { message = "Deleted" });
        }

        [HttpPut("{id}/approve"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Approve(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var ev = await _eventService.ApproveAsync(id);
                await RecordAuditAsync(userId, "Event.Approve", "Event", ev.Id);
                return Ok(ev);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{id}/reject"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Reject(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var ev = await _eventService.RejectAsync(id);
                await RecordAuditAsync(userId, "Event.Reject", "Event", ev.Id);
                return Ok(ev);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{id}/complete"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Complete(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            try
            {
                var ev = await _eventService.CompleteAsync(id, role == "Admin" ? null : userId);
                await RecordAuditAsync(userId, "Event.Complete", "Event", ev.Id);
                return Ok(ev);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("{id}/registrations"), Authorize]
        public async Task<IActionResult> GetRegistrations(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var ev = await _eventService.GetByIdAsync(id);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (role != "Admin" && ev.OrganizerId != userId) return Forbid();

            var regs = await _registrationService.GetByEventAsync(id);
            return Ok(regs);
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

        private static string? ValidateCoordinates(decimal? latitude, decimal? longitude)
        {
            if (!latitude.HasValue || !longitude.HasValue)
                return "Event coordinates are required. Please choose a location on the map.";
            if (latitude.Value < -90 || latitude.Value > 90)
                return "Latitude must be between -90 and 90.";
            if (longitude.Value < -180 || longitude.Value > 180)
                return "Longitude must be between -180 and 180.";

            return null;
        }
    }

    public class EventCreateDto
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public string? Location { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int MaxParticipants { get; set; }
        public int CategoryId { get; set; }
        public string? ImageUrl { get; set; }
        public string? RequiredSkillIds { get; set; }
    }

    public class EventUpdateDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Location { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? MaxParticipants { get; set; }
        public int? CategoryId { get; set; }
        public string? ImageUrl { get; set; }
        public string? RequiredSkillIds { get; set; }
    }
}
