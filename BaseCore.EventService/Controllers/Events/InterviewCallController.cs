using System.Security.Claims;
using BaseCore.EventService.Services;
using BaseCore.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    public class InterviewCallController : ControllerBase
    {
        private readonly MySqlDbContext _context;
        private readonly IDailyVideoService _dailyVideoService;

        public InterviewCallController(MySqlDbContext context, IDailyVideoService dailyVideoService)
        {
            _context = context;
            _dailyVideoService = dailyVideoService;
        }

        [HttpGet("api/interviews/{slotId}/daily-token"), Authorize(Roles = "Organizer,Volunteer")]
        [EnableRateLimiting("read-sensitive")]
        public async Task<IActionResult> GetDailyToken(int slotId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var slot = await _context.InterviewSlots
                .Include(s => s.Event)
                    .ThenInclude(e => e.Organizer)
                .Include(s => s.Registration)
                    .ThenInclude(r => r.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == slotId);

            if (slot == null) return NotFound(new { message = "Không tìm thấy lịch phỏng vấn." });
            if (slot.Status != "Scheduled")
                return BadRequest(new { message = "Phòng phỏng vấn không còn hoạt động." });
            if (slot.Event == null || slot.Registration == null)
                return BadRequest(new { message = "Dữ liệu phỏng vấn chưa đầy đủ." });
            if (string.IsNullOrWhiteSpace(slot.MeetingUrl) || !slot.MeetingUrl.Contains("daily.co", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Lịch phỏng vấn chưa có phòng Daily. Vui lòng đổi lịch hoặc tạo lại lịch phỏng vấn." });
            if (!_dailyVideoService.IsConfigured)
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Daily chưa được cấu hình." });

            var isOrganizer = slot.Event.OrganizerId == userId;
            var isVolunteer = slot.Registration.UserId == userId;
            if (!isOrganizer && !isVolunteer) return Forbid();

            var selfName = isOrganizer
                ? slot.Event.Organizer?.Name ?? "Nhà tổ chức"
                : slot.Registration.User?.Name ?? slot.Registration.User?.UserName ?? "Tình nguyện viên";

            var token = await _dailyVideoService.CreateMeetingTokenAsync(
                slot.MeetingUrl,
                userId,
                selfName,
                isOwner: isOrganizer,
                slot.ScheduledAt,
                slot.DurationMinutes);

            return Ok(new
            {
                provider = "Daily",
                roomUrl = slot.MeetingUrl,
                roomName = token.RoomName,
                meetingToken = token.Token,
                canStartCall = isOrganizer,
                role = isOrganizer ? "Organizer" : "Volunteer",
                selfName,
                scheduledAt = slot.ScheduledAt,
                durationMinutes = slot.DurationMinutes,
                eventTitle = slot.Event.Title
            });
        }
    }
}
