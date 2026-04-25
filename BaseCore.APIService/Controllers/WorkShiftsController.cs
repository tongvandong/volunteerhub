using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/events/{eventId}/shifts")]
    [ApiController]
    public class WorkShiftsController : ControllerBase
    {
        private readonly IWorkShiftRepositoryEF _repo;
        private readonly IEventRepositoryEF _eventRepo;

        public WorkShiftsController(IWorkShiftRepositoryEF repo, IEventRepositoryEF eventRepo)
        {
            _repo = repo;
            _eventRepo = eventRepo;
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
            return CreatedAtAction(nameof(GetById), new { eventId, id = shift.Id }, shift);
        }

        [HttpPut("{id}"), Authorize(Roles = "Organizer")]
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
            return Ok(shift);
        }

        [HttpDelete("{id}"), Authorize(Roles = "Organizer")]
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
            return Ok(new { message = "Deleted" });
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
