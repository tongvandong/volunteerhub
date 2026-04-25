using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    public class RatingsController : ControllerBase
    {
        private readonly IRatingRepositoryEF _ratingRepo;

        public RatingsController(IRatingRepositoryEF ratingRepo)
        {
            _ratingRepo = ratingRepo;
        }

        [HttpPost("api/events/{eventId}/ratings"), Authorize]
        public async Task<IActionResult> CreateRating(int eventId, [FromBody] RatingCreateDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var exists = await _ratingRepo.ExistsAsync(eventId, userId, dto.RateeId);
            if (exists) return BadRequest(new { message = "Already rated this user for this event" });

            if (dto.Score < 1 || dto.Score > 5) return BadRequest(new { message = "Score must be between 1 and 5" });

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
            return Ok(rating);
        }

        [HttpGet("api/users/{userId}/ratings")]
        public async Task<IActionResult> GetUserRatings(int userId)
        {
            var ratings = await _ratingRepo.GetByRateeAsync(userId);
            var avgScore = await _ratingRepo.GetAverageScoreAsync(userId);
            return Ok(new { ratings, averageScore = avgScore, totalRatings = ratings.Count });
        }
    }

    public class RatingCreateDto
    {
        public int RateeId { get; set; }
        public int Score { get; set; }
        public string? Comment { get; set; }
    }
}
