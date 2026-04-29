using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Services.VolunteerHub;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    public class RegistrationsController : ControllerBase
    {
        private readonly IRegistrationService _registrationService;

        public RegistrationsController(IRegistrationService registrationService)
        {
            _registrationService = registrationService;
        }

        [HttpPost("api/events/{eventId}/register"), Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> Register(int eventId, [FromBody] RegisterDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var reg = await _registrationService.RegisterAsync(eventId, userId, dto.ShiftId, dto.Note);
                return Ok(reg);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("api/events/{eventId}/register"), Authorize(Roles = "Volunteer")]
        public async Task<IActionResult> Withdraw(int eventId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                await _registrationService.WithdrawAsync(eventId, userId);
                return Ok(new { message = "Withdrawn" });
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("api/events/{eventId}/registrations/{regId}/confirm"), Authorize(Roles = "Organizer")]
        public async Task<IActionResult> Confirm(int eventId, int regId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var reg = await _registrationService.ConfirmAsync(eventId, regId, userId);
                return Ok(reg);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPut("api/events/{eventId}/registrations/{regId}/cancel"), Authorize(Roles = "Organizer")]
        public async Task<IActionResult> Cancel(int eventId, int regId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var reg = await _registrationService.CancelAsync(eventId, regId, userId);
                return Ok(reg);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPost("api/events/{eventId}/registrations/{regId}/checkin"), Authorize(Roles = "Organizer")]
        public async Task<IActionResult> CheckIn(int eventId, int regId, [FromBody] CheckInDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var reg = await _registrationService.CheckInAsync(eventId, regId, userId, dto.QrCode, dto.Latitude, dto.Longitude);
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
