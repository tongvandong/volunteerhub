using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BaseCore.Services.VolunteerHub;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    public class RegistrationsController : ControllerBase
    {
        private readonly IRegistrationService _registrationService;
        private readonly IAuditLogService _auditLogService;

        public RegistrationsController(IRegistrationService registrationService, IAuditLogService auditLogService)
        {
            _registrationService = registrationService;
            _auditLogService = auditLogService;
        }

        [HttpPost("api/events/{eventId}/register"), Authorize(Roles = "Volunteer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Register(int eventId, [FromBody] RegisterDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var reg = await _registrationService.RegisterAsync(eventId, userId, dto.ShiftId, dto.Note);
                await RecordAuditAsync(userId, "Registration.Register", "Registration", reg.Id, $"EventId={eventId};ShiftId={dto.ShiftId}");
                return Ok(reg);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("api/events/{eventId}/register"), Authorize(Roles = "Volunteer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Withdraw(int eventId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                await _registrationService.WithdrawAsync(eventId, userId);
                await RecordAuditAsync(userId, "Registration.Withdraw", "Event", eventId);
                return Ok(new { message = "Withdrawn" });
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("api/events/{eventId}/registrations/{regId}/confirm"), Authorize(Roles = "Organizer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Confirm(int eventId, int regId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var reg = await _registrationService.ConfirmAsync(eventId, regId, userId);
                await RecordAuditAsync(userId, "Registration.Confirm", "Registration", reg.Id, $"EventId={eventId}");
                return Ok(reg);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("api/events/{eventId}/registrations/{regId}/cancel"), Authorize(Roles = "Organizer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Cancel(int eventId, int regId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var reg = await _registrationService.CancelAsync(eventId, regId, userId);
                await RecordAuditAsync(userId, "Registration.Cancel", "Registration", reg.Id, $"EventId={eventId}");
                return Ok(reg);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("api/events/{eventId}/registrations/{regId}/checkin"), Authorize(Roles = "Organizer")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> CheckIn(int eventId, int regId, [FromBody] CheckInDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var reg = await _registrationService.CheckInAsync(eventId, regId, userId, dto.QrCode, dto.Latitude, dto.Longitude);
                await RecordAuditAsync(userId, "Registration.CheckIn", "Registration", reg.Id, $"EventId={eventId}");
                return Ok(reg);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("api/my-registrations"), Authorize]
        public async Task<IActionResult> MyRegistrations()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var regs = await _registrationService.GetByUserAsync(userId);
            return Ok(regs);
        }

        [HttpGet("api/events/{eventId}/my-registration"), Authorize]
        public async Task<IActionResult> MyRegistration(int eventId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var reg = await _registrationService.GetByEventAndUserAsync(eventId, userId);
            return Ok(reg);
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

    public class RegisterDto
    {
        public int? ShiftId { get; set; }
        public string? Note { get; set; }
    }

    public class CheckInDto
    {
        public string? QrCode { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }
}
