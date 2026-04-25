using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Services.VolunteerHub;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/events")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IRegistrationService _registrationService;

        public EventsController(IEventService eventService, IRegistrationService registrationService)
        {
            _eventService = eventService;
            _registrationService = registrationService;
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

        [HttpPost, Authorize(Roles = "Organizer")]
        public async Task<IActionResult> Create([FromBody] EventCreateDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Event title is required" });

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
            return CreatedAtAction(nameof(GetById), new { id = ev.Id }, ev);
        }

        [HttpPut("{id}"), Authorize(Roles = "Organizer")]
        public async Task<IActionResult> Update(int id, [FromBody] EventUpdateDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var ev = await _eventService.GetByIdAsync(id);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (ev.OrganizerId != userId) return Forbid();
            if (dto.Title != null && string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Event title cannot be empty" });

            ev.Title = dto.Title?.Trim() ?? ev.Title;
            ev.Description = dto.Description ?? ev.Description;
            ev.Location = dto.Location ?? ev.Location;
            ev.Latitude = dto.Latitude ?? ev.Latitude;
            ev.Longitude = dto.Longitude ?? ev.Longitude;
            ev.StartDate = dto.StartDate ?? ev.StartDate;
            ev.EndDate = dto.EndDate ?? ev.EndDate;
            ev.MaxParticipants = dto.MaxParticipants ?? ev.MaxParticipants;
            ev.CategoryId = dto.CategoryId ?? ev.CategoryId;
            ev.ImageUrl = dto.ImageUrl ?? ev.ImageUrl;
            ev.RequiredSkillIds = dto.RequiredSkillIds ?? ev.RequiredSkillIds;

            await _eventService.UpdateAsync(ev);
            return Ok(ev);
        }

        [HttpDelete("{id}"), Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            var ev = await _eventService.GetByIdAsync(id);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (role != "Admin" && ev.OrganizerId != userId) return Forbid();

            await _eventService.DeleteAsync(id);
            return Ok(new { message = "Deleted" });
        }

        [HttpPut("{id}/approve"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            try { var ev = await _eventService.ApproveAsync(id); return Ok(ev); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{id}/reject"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id)
        {
            try { var ev = await _eventService.RejectAsync(id); return Ok(ev); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("{id}/complete"), Authorize(Roles = "Organizer,Admin")]
        public async Task<IActionResult> Complete(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            try { var ev = await _eventService.CompleteAsync(id, role == "Admin" ? null : userId); return Ok(ev); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("{id}/registrations"), Authorize]
        public async Task<IActionResult> GetRegistrations(int id)
        {
            var regs = await _registrationService.GetByEventAsync(id);
            return Ok(regs);
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
