using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using BaseCore.Services.VolunteerHub;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/events/{eventId}/shifts")]
    [ApiController]
    public class WorkShiftsController : ControllerBase
    {
        private readonly IWorkShiftRepositoryEF _repo;
        private readonly IEventRepositoryEF _eventRepo;
        private readonly IAuditLogService _auditLogService;

        public WorkShiftsController(IWorkShiftRepositoryEF repo, IEventRepositoryEF eventRepo, IAuditLogService auditLogService)
        {
            _repo = repo;
            _eventRepo = eventRepo;
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetByEvent(int eventId)
        {
            var shifts = await _repo.GetByEventAsync(eventId);
            return Ok(shifts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int eventId, int id)
        {
            var shift = await _repo.GetByIdAsync(id);
            if (shift == null || shift.EventId != eventId) return NotFound();
            return Ok(shift);
        }

        [HttpPost, Authorize(Roles = "Organizer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Create(int eventId, [FromBody] WorkShiftDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var ev = await _eventRepo.GetByIdAsync(eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (ev.OrganizerId != userId) return Forbid();

            var shift = new WorkShift
            {
                EventId = eventId,
                Name = dto.Name,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                MaxVolunteers = dto.MaxVolunteers,
                RequiredSkillId = dto.RequiredSkillId
            };
            await _repo.AddAsync(shift);
            await RecordAuditAsync(userId, "WorkShift.Create", "WorkShift", shift.Id, $"EventId={eventId}");
            return CreatedAtAction(nameof(GetById), new { eventId, id = shift.Id }, shift);
        }

        [HttpPut("{id}"), Authorize(Roles = "Organizer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Update(int eventId, int id, [FromBody] WorkShiftDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var ev = await _eventRepo.GetByIdAsync(eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (ev.OrganizerId != userId) return Forbid();

            var shift = await _repo.GetByIdAsync(id);
            if (shift == null || shift.EventId != eventId) return NotFound();

            shift.Name = dto.Name ?? shift.Name;
            shift.StartTime = dto.StartTime != default ? dto.StartTime : shift.StartTime;
            shift.EndTime = dto.EndTime != default ? dto.EndTime : shift.EndTime;
            shift.MaxVolunteers = dto.MaxVolunteers > 0 ? dto.MaxVolunteers : shift.MaxVolunteers;
            shift.RequiredSkillId = dto.RequiredSkillId ?? shift.RequiredSkillId;

            await _repo.UpdateAsync(shift);
            await RecordAuditAsync(userId, "WorkShift.Update", "WorkShift", shift.Id, $"EventId={eventId}");
            return Ok(shift);
        }

        [HttpDelete("{id}"), Authorize(Roles = "Organizer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Delete(int eventId, int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var ev = await _eventRepo.GetByIdAsync(eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (ev.OrganizerId != userId) return Forbid();

            var shift = await _repo.GetByIdAsync(id);
            if (shift == null || shift.EventId != eventId) return NotFound();

            await _repo.DeleteAsync(shift);
            await RecordAuditAsync(userId, "WorkShift.Delete", "WorkShift", id, $"EventId={eventId}");
            return Ok(new { message = "Deleted" });
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

    public class WorkShiftDto
    {
        public string Name { get; set; } = "";
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int MaxVolunteers { get; set; }
        public int? RequiredSkillId { get; set; }
    }
}
