using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using BaseCore.Services.VolunteerHub;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IVolunteerProfileRepositoryEF _profileRepo;
        private readonly ISkillRepositoryEF _skillRepo;
        private readonly IRegistrationRepositoryEF _registrationRepo;
        private readonly ICertificateRepositoryEF _certificateRepo;
        private readonly IAuditLogService _auditLogService;

        public ProfileController(
            IVolunteerProfileRepositoryEF profileRepo,
            ISkillRepositoryEF skillRepo,
            IRegistrationRepositoryEF registrationRepo,
            ICertificateRepositoryEF certificateRepo,
            IAuditLogService auditLogService)
        {
            _profileRepo = profileRepo;
            _skillRepo = skillRepo;
            _registrationRepo = registrationRepo;
            _certificateRepo = certificateRepo;
            _auditLogService = auditLogService;
        }

        [HttpGet("api/profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var profile = await _profileRepo.GetByUserIdAsync(userId);
            var skills = await _profileRepo.GetSkillsByUserIdAsync(userId);
            return Ok(new { profile, skills });
        }

        [HttpGet("api/profile/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProfile(int userId)
        {
            var profile = await _profileRepo.GetByUserIdAsync(userId);
            var skills = await _profileRepo.GetSkillsByUserIdAsync(userId);
            return Ok(new { profile, skills });
        }

        [HttpPut("api/profile")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var profile = await _profileRepo.GetByUserIdAsync(userId);
            if (profile == null)
            {
                profile = new VolunteerProfile { UserId = userId };
                profile.BloodType = dto.BloodType ?? "";
                profile.Languages = dto.Languages ?? "";
                profile.Interests = dto.Interests ?? "";
                profile.Bio = dto.Bio ?? "";
                profile.AvatarUrl = dto.AvatarUrl ?? "";
                await _profileRepo.AddAsync(profile);
            }
            else
            {
                profile.BloodType = dto.BloodType ?? profile.BloodType;
                profile.Languages = dto.Languages ?? profile.Languages;
                profile.Interests = dto.Interests ?? profile.Interests;
                profile.Bio = dto.Bio ?? profile.Bio;
                profile.AvatarUrl = dto.AvatarUrl ?? profile.AvatarUrl;
                await _profileRepo.UpdateAsync(profile);
            }
            await RecordAuditAsync(userId, "Profile.Update", "VolunteerProfile", profile.Id);
            return Ok(profile);
        }

        [HttpGet("api/profile/passport")]
        public async Task<IActionResult> GetPassport()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();

            var profile = await _profileRepo.GetByUserIdAsync(userId);
            var skills = await _profileRepo.GetSkillsByUserIdAsync(userId);
            var registrations = await _registrationRepo.GetByUserAsync(userId);
            var certificates = await _certificateRepo.GetByUserAsync(userId);

            return Ok(new
            {
                profile,
                skills,
                totalEvents = registrations.Count(r => r.IsAttended),
                totalHours = profile?.TotalVolunteerHours ?? 0,
                registrations,
                certificates
            });
        }

        // SKILLS
        [HttpGet("api/skills")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllSkills() => Ok(await _skillRepo.GetAllAsync());

        [HttpPost("api/skills"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> CreateSkill([FromBody] SkillDto dto)
        {
            var skill = new Skill { Name = dto.Name, Category = dto.Category ?? "" };
            await _skillRepo.AddAsync(skill);
            await RecordAuditAsync(CurrentUserId(), "Skill.Create", "Skill", skill.Id, $"Name={skill.Name}");
            return Ok(skill);
        }

        [HttpPut("api/skills/{id}"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> UpdateSkill(int id, [FromBody] SkillDto dto)
        {
            var skill = await _skillRepo.GetByIdAsync(id);
            if (skill == null) return NotFound();
            skill.Name = dto.Name;
            skill.Category = dto.Category ?? skill.Category;
            await _skillRepo.UpdateAsync(skill);
            await RecordAuditAsync(CurrentUserId(), "Skill.Update", "Skill", skill.Id, $"Name={skill.Name}");
            return Ok(skill);
        }

        [HttpDelete("api/skills/{id}"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> DeleteSkill(int id)
        {
            var skill = await _skillRepo.GetByIdAsync(id);
            if (skill == null) return NotFound();
            await _skillRepo.DeleteAsync(skill);
            await RecordAuditAsync(CurrentUserId(), "Skill.Delete", "Skill", id);
            return Ok(new { message = "Deleted" });
        }

        [HttpPost("api/profile/skills")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> AddSkill([FromBody] AddSkillDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            try
            {
                var vs = new VolunteerSkill { UserId = userId, SkillId = dto.SkillId, Level = dto.Level ?? "Beginner" };
                await _profileRepo.AddSkillAsync(vs);
                await RecordAuditAsync(userId, "ProfileSkill.Add", "VolunteerSkill", vs.Id, $"SkillId={dto.SkillId}");
                return Ok(vs);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("api/profile/skills/{skillId}")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> RemoveSkill(int skillId)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            await _profileRepo.RemoveSkillAsync(userId, skillId);
            await RecordAuditAsync(userId, "ProfileSkill.Remove", "Skill", skillId);
            return Ok(new { message = "Skill removed" });
        }

        private int? CurrentUserId()
        {
            return int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId)
                ? userId
                : (int?)null;
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

    public class ProfileUpdateDto
    {
        public string? BloodType { get; set; }
        public string? Languages { get; set; }
        public string? Interests { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
    }

    public class SkillDto
    {
        public string Name { get; set; } = "";
        public string? Category { get; set; }
    }

    public class AddSkillDto
    {
        public int SkillId { get; set; }
        public string? Level { get; set; }
    }
}
