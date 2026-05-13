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
    public class RatingsController : ControllerBase
    {
        private readonly IRatingRepositoryEF _ratingRepo;
        private readonly MySqlDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public RatingsController(IRatingRepositoryEF ratingRepo, MySqlDbContext context, IAuditLogService auditLogService)
        {
            _ratingRepo = ratingRepo;
            _context = context;
            _auditLogService = auditLogService;
        }

        [HttpPost("api/events/{eventId}/ratings"), Authorize]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> CreateRating(int eventId, [FromBody] RatingCreateDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            if (userId == dto.RateeId)
                return BadRequest(new { message = "Cannot rate yourself" });

            var exists = await _ratingRepo.ExistsAsync(eventId, userId, dto.RateeId);
            if (exists) return BadRequest(new { message = "Already rated this user for this event" });

            if (dto.Score < 1 || dto.Score > 5) return BadRequest(new { message = "Score must be between 1 and 5" });

            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (ev.Status != "Completed") return BadRequest(new { message = "Ratings are available after event completion" });

            var rater = await _context.Users.FindAsync(userId);
            var ratee = await _context.Users.FindAsync(dto.RateeId);
            if (rater == null || ratee == null) return BadRequest(new { message = "Invalid rating users" });

            var raterAttended = await _context.Registrations.AnyAsync(r =>
                r.EventId == eventId && r.UserId == userId && r.IsAttended);
            var rateeAttended = await _context.Registrations.AnyAsync(r =>
                r.EventId == eventId && r.UserId == dto.RateeId && r.IsAttended);

            var volunteerRatesOrganizer = rater.UserType == 0 && raterAttended && dto.RateeId == ev.OrganizerId;
            var organizerRatesVolunteer = rater.UserType == 1 && ev.OrganizerId == userId && ratee.UserType == 0 && rateeAttended;

            if (!volunteerRatesOrganizer && !organizerRatesVolunteer)
                return Forbid();

            var rating = new Rating
            {
                EventId = eventId,
                RaterId = userId,
                RateeId = dto.RateeId,
                Score = dto.Score,
                Comment = dto.Comment ?? "",
                CreatedAt = DateTime.UtcNow
            };
            await _ratingRepo.AddAsync(rating);
            await _auditLogService.RecordAsync(
                userId,
                "Rating.Create",
                "Rating",
                rating.Id,
                $"EventId={eventId};RateeId={dto.RateeId};Score={dto.Score}",
                HttpContext.Connection.RemoteIpAddress?.ToString());
            return Ok(rating);
        }

        [HttpGet("api/users/{userId}/ratings")]
        public async Task<IActionResult> GetUserRatings(int userId)
        {
            var ratings = await _ratingRepo.GetByRateeAsync(userId);
            var avgScore = await _ratingRepo.GetAverageScoreAsync(userId);
            return Ok(new { ratings, averageScore = avgScore, totalRatings = ratings.Count });
        }

        [HttpGet("api/admin/ratings"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("read-sensitive")]
        public async Task<IActionResult> GetAdminRatings(
            [FromQuery] int? eventId,
            [FromQuery] bool? hidden,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Ratings
                .AsNoTracking()
                .Include(r => r.Event)
                .Include(r => r.Rater)
                .Include(r => r.Ratee)
                .AsQueryable();

            if (eventId.HasValue)
            {
                query = query.Where(r => r.EventId == eventId.Value);
            }

            if (hidden.HasValue)
            {
                query = query.Where(r => r.IsHidden == hidden.Value);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.EventId,
                    eventTitle = r.Event != null ? r.Event.Title : "",
                    raterId = r.RaterId,
                    raterName = r.Rater != null ? (r.Rater.Name ?? r.Rater.UserName) : "",
                    rateeId = r.RateeId,
                    rateeName = r.Ratee != null ? (r.Ratee.Name ?? r.Ratee.UserName) : "",
                    r.Score,
                    r.Comment,
                    r.CreatedAt,
                    r.IsHidden,
                    r.HiddenReason,
                    r.HiddenAt,
                    r.HiddenBy
                })
                .ToListAsync();

            return Ok(new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpPut("api/ratings/{id}/hide"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> HideRating(int id, [FromBody] RatingModerationDto? dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var rating = await _context.Ratings.FindAsync(id);
            if (rating == null) return NotFound();

            rating.IsHidden = true;
            rating.HiddenReason = dto?.Reason?.Trim() ?? "";
            rating.HiddenAt = DateTime.UtcNow;
            rating.HiddenBy = userId;
            await _context.SaveChangesAsync();
            await _auditLogService.RecordAsync(userId, "Rating.Hide", "Rating", id, dto?.Reason,
                HttpContext.Connection.RemoteIpAddress?.ToString());
            return Ok(rating);
        }

        [HttpPut("api/ratings/{id}/unhide"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> UnhideRating(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var rating = await _context.Ratings.FindAsync(id);
            if (rating == null) return NotFound();

            rating.IsHidden = false;
            rating.HiddenReason = "";
            rating.HiddenAt = null;
            rating.HiddenBy = null;
            await _context.SaveChangesAsync();
            await _auditLogService.RecordAsync(userId, "Rating.Unhide", "Rating", id, null,
                HttpContext.Connection.RemoteIpAddress?.ToString());
            return Ok(rating);
        }

        [HttpDelete("api/ratings/{id}"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> DeleteRating(int id)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var rating = await _context.Ratings.FindAsync(id);
            if (rating == null) return NotFound();

            _context.Ratings.Remove(rating);
            await _context.SaveChangesAsync();
            await _auditLogService.RecordAsync(userId, "Rating.Delete", "Rating", id, null,
                HttpContext.Connection.RemoteIpAddress?.ToString());
            return Ok(new { message = "Deleted" });
        }
    }

    public class RatingCreateDto
    {
        public int RateeId { get; set; }
        public int Score { get; set; }
        public string? Comment { get; set; }
    }

    public class RatingModerationDto
    {
        public string? Reason { get; set; }
    }
}
