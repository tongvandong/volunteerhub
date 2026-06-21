using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Services.VolunteerHub;
using System.Security.Claims;
using System.Text.Json;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    public class BadgesController : ControllerBase
    {
        private readonly IBadgeService _badgeService;
        private readonly MySqlDbContext _context;

        public BadgesController(IBadgeService badgeService, MySqlDbContext context)
        {
            _badgeService = badgeService;
            _context = context;
        }

        [HttpGet("api/badges")]
        public async Task<IActionResult> GetAll() => Ok(await _badgeService.GetAllAsync());

        [HttpGet("api/my-badges"), Authorize]
        public async Task<IActionResult> GetMyBadges()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var badges = await _badgeService.GetByUserAsync(userId);
            return Ok(badges);
        }

        [HttpPost("api/badges"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] BadgeDto dto)
        {
            var error = ValidateBadge(dto);
            if (error != null) return BadRequest(new { message = error });

            var badge = new Badge
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim() ?? "",
                IconUrl = dto.IconUrl?.Trim() ?? "",
                Condition = NormalizeCondition(dto.Condition)
            };

            _context.Badges.Add(badge);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = badge.Id }, badge);
        }

        [HttpPut("api/badges/{id}"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] BadgeDto dto)
        {
            var badge = await _context.Badges.FindAsync(id);
            if (badge == null) return NotFound(new { message = "Badge not found" });

            var error = ValidateBadge(dto);
            if (error != null) return BadRequest(new { message = error });

            badge.Name = dto.Name.Trim();
            badge.Description = dto.Description?.Trim() ?? "";
            badge.IconUrl = dto.IconUrl?.Trim() ?? "";
            badge.Condition = NormalizeCondition(dto.Condition);

            await _context.SaveChangesAsync();
            return Ok(badge);
        }

        [HttpDelete("api/badges/{id}"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var badge = await _context.Badges.FindAsync(id);
            if (badge == null) return NotFound(new { message = "Badge not found" });

            var awardedCount = await _context.UserBadges.CountAsync(ub => ub.BadgeId == id);
            if (awardedCount > 0)
                return BadRequest(new { message = $"Cannot delete badge because it has been awarded to {awardedCount} user(s). Edit the badge instead." });

            _context.Badges.Remove(badge);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Deleted" });
        }

        private static string? ValidateBadge(BadgeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return "Badge name is required";
            if (dto.Name.Trim().Length > 100)
                return "Badge name must be 100 characters or less";
            if ((dto.Description?.Trim().Length ?? 0) > 500)
                return "Badge description must be 500 characters or less";
            if ((dto.IconUrl?.Trim().Length ?? 0) > 500)
                return "Badge icon URL must be 500 characters or less";

            try
            {
                var condition = JsonSerializer.Deserialize<Dictionary<string, decimal>>(NormalizeCondition(dto.Condition));
                if (condition == null || condition.Count == 0)
                    return "Badge condition must include at least one rule";
                if (!condition.ContainsKey("min_events") && !condition.ContainsKey("min_hours"))
                    return "Badge condition must include min_events or min_hours";
                if (condition.Any(pair => pair.Value < 0))
                    return "Badge condition values cannot be negative";
            }
            catch
            {
                return "Badge condition must be valid JSON, e.g. {\"min_hours\":10}";
            }

            return null;
        }

        private static string NormalizeCondition(string? condition)
        {
            return string.IsNullOrWhiteSpace(condition) ? "{}" : condition.Trim();
        }
    }

    public class BadgeDto
    {
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string IconUrl { get; set; } = "";
        public string Condition { get; set; } = "";
    }
}
