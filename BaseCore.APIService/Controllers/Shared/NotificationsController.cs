using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Services.VolunteerHub;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);
            var (items, totalCount) = await _notificationService.GetByUserAsync(userId, page, pageSize);
            return Ok(new { items, totalCount, page, pageSize, totalPages = (int)Math.Ceiling((double)totalCount / pageSize) });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            await _notificationService.MarkReadAsync(id, userId);
            return Ok(new { message = "Marked as read" });
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            await _notificationService.MarkAllReadAsync(userId);
            return Ok(new { message = "All marked as read" });
        }

        // Đăng ký Expo push token của thiết bị cho user hiện tại.
        [HttpPost("device-token")]
        public async Task<IActionResult> RegisterDeviceToken([FromBody] DeviceTokenDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            if (string.IsNullOrWhiteSpace(dto?.Token))
                return BadRequest(new { message = "Token is required" });
            await _notificationService.RegisterDeviceTokenAsync(userId, dto.Token, dto.Platform ?? "");
            return Ok(new { message = "Registered" });
        }

        [HttpDelete("device-token")]
        public async Task<IActionResult> RemoveDeviceToken([FromBody] DeviceTokenDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            if (!string.IsNullOrWhiteSpace(dto?.Token))
                await _notificationService.RemoveDeviceTokenAsync(userId, dto.Token);
            return Ok(new { message = "Removed" });
        }
    }

    public class DeviceTokenDto
    {
        public string Token { get; set; } = "";
        public string? Platform { get; set; }
    }
}
