using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    public class SponsorController : ControllerBase
    {
        private readonly IEventSponsorRepositoryEF _sponsorRepo;

        public SponsorController(IEventSponsorRepositoryEF sponsorRepo)
        {
            _sponsorRepo = sponsorRepo;
        }

        [HttpGet("api/events/{eventId}/sponsors")]
        public async Task<IActionResult> GetSponsors(int eventId)
        {
            var sponsors = await _sponsorRepo.GetByEventAsync(eventId);
            return Ok(sponsors);
        }

        [HttpPost("api/events/{eventId}/sponsors"), Authorize(Roles = "Sponsor")]
        public async Task<IActionResult> AddSponsor(int eventId, [FromBody] SponsorDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            if (dto.Amount <= 0)
                return BadRequest(new { message = "Sponsor amount must be greater than zero" });

            var sponsor = new EventSponsor
            {
                EventId = eventId,
                SponsorId = userId,
                ContributionType = string.IsNullOrWhiteSpace(dto.ContributionType) ? "Financial" : dto.ContributionType.Trim(),
                Amount = dto.Amount,
                Note = dto.Note ?? "",
                SponsoredAt = DateTime.UtcNow
            };
            await _sponsorRepo.AddAsync(sponsor);
            return Ok(sponsor);
        }

        [HttpGet("api/sponsors/my"), Authorize(Roles = "Sponsor")]
        public async Task<IActionResult> GetMySponsorships()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var sponsors = await _sponsorRepo.GetBySponsorAsync(userId);
            return Ok(sponsors);
        }
    }

    public class SponsorDto
    {
        public string ContributionType { get; set; } = "Financial";
        public decimal Amount { get; set; }
        public string? Note { get; set; }
    }
}
