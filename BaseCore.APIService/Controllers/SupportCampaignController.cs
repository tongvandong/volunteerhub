using System.Security.Claims;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Services.VolunteerHub;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    public class SupportCampaignController : ControllerBase
    {
        private static readonly string[] PublicCampaignStatuses = ["Open", "Closed", "Reported"];
        private readonly MySqlDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public SupportCampaignController(MySqlDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        [HttpGet("api/events/{eventId}/support-campaigns")]
        public async Task<IActionResult> GetByEvent(int eventId)
        {
            var ev = await _context.Events.AsNoTracking().FirstOrDefaultAsync(e => e.Id == eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });

            var canManage = CanManageEvent(ev, GetUserIdOrNull());
            var query = _context.SupportCampaigns
                .AsNoTracking()
                .Where(c => c.EventId == eventId);

            if (!canManage)
            {
                query = query.Where(c =>
                    PublicCampaignStatuses.Contains(c.Status) &&
                    c.Status != "Cancelled" &&
                    (ev.Status == "Approved" || ev.Status == "Completed"));
            }

            var campaigns = await query
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.EventId,
                    c.Title,
                    c.Description,
                    c.TargetAmount,
                    c.MinimumAmount,
                    c.StartDate,
                    c.EndDate,
                    c.ReceiveInfo,
                    c.TransparencyNote,
                    c.Status,
                    c.CreatedAt,
                    c.UpdatedAt,
                    c.UsedAmount,
                    c.ReportSummary,
                    c.ExpenseDetails,
                    c.ReportAttachmentUrl,
                    c.ReportedAt,
                    confirmedAmount = c.Donations.Where(d => d.Status == "Confirmed").Sum(d => (decimal?)d.Amount) ?? 0,
                    pendingAmount = canManage ? c.Donations.Where(d => d.Status == "PendingConfirmation").Sum(d => (decimal?)d.Amount) ?? 0 : 0,
                    confirmedCount = c.Donations.Count(d => d.Status == "Confirmed"),
                    pendingCount = canManage ? c.Donations.Count(d => d.Status == "PendingConfirmation") : 0,
                    publicDonors = c.Donations
                        .Where(d => d.Status == "Confirmed")
                        .OrderByDescending(d => d.ConfirmedAt ?? d.CreatedAt)
                        .Take(10)
                        .Select(d => new
                        {
                            d.Id,
                            d.Amount,
                            displayName = d.IsAnonymous ? "Ẩn danh" : d.DisplayName,
                            d.IsAnonymous,
                            d.Note,
                            d.CreatedAt,
                            d.ConfirmedAt
                        })
                })
                .ToListAsync();

            return Ok(campaigns);
        }

        [HttpGet("api/support-campaigns/{campaignId}")]
        public async Task<IActionResult> GetById(int campaignId)
        {
            var campaign = await _context.SupportCampaigns
                .AsNoTracking()
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.Id == campaignId);
            if (campaign == null) return NotFound(new { message = "Campaign not found" });

            var canManage = CanManageEvent(campaign.Event, GetUserIdOrNull());
            if (!canManage && (!PublicCampaignStatuses.Contains(campaign.Status) || campaign.Event.Status is not ("Approved" or "Completed")))
                return NotFound(new { message = "Campaign not found" });

            var summary = await BuildCampaignSummary(campaign.Id);
            return Ok(new
            {
                campaign.Id,
                campaign.EventId,
                campaign.Title,
                campaign.Description,
                campaign.TargetAmount,
                campaign.MinimumAmount,
                campaign.StartDate,
                campaign.EndDate,
                campaign.ReceiveInfo,
                campaign.TransparencyNote,
                campaign.Status,
                campaign.CreatedAt,
                campaign.UpdatedAt,
                campaign.UsedAmount,
                campaign.ReportSummary,
                campaign.ExpenseDetails,
                campaign.ReportAttachmentUrl,
                campaign.ReportedAt,
                summary
            });
        }

        [HttpPost("api/events/{eventId}/support-campaigns"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Create(int eventId, [FromBody] SupportCampaignDto dto)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (!CanManageEvent(ev, userId)) return Forbid();
            if (ev.Status is "Rejected" or "Cancelled")
                return BadRequest(new { message = "Cannot create campaign for rejected or cancelled event" });

            var validation = ValidateCampaign(dto, requireReceiveInfo: false);
            if (validation != null) return BadRequest(new { message = validation });

            var campaign = new SupportCampaign
            {
                EventId = eventId,
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                TargetAmount = dto.TargetAmount,
                MinimumAmount = dto.MinimumAmount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                ReceiveInfo = dto.ReceiveInfo?.Trim() ?? "",
                TransparencyNote = dto.TransparencyNote?.Trim() ?? "",
                Status = NormalizeCampaignStatus(dto.Status, fallback: "Draft"),
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            if (campaign.Status == "Open")
            {
                var openValidation = CanOpenCampaign(ev, campaign);
                if (openValidation != null) return BadRequest(new { message = openValidation });
            }

            _context.SupportCampaigns.Add(campaign);
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SupportCampaign.Create", "SupportCampaign", campaign.Id, $"EventId={eventId};Status={campaign.Status};Target={campaign.TargetAmount:0.##}");

            return Ok(campaign);
        }

        [HttpPut("api/support-campaigns/{campaignId}"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Update(int campaignId, [FromBody] SupportCampaignDto dto)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var campaign = await _context.SupportCampaigns.Include(c => c.Event).FirstOrDefaultAsync(c => c.Id == campaignId);
            if (campaign == null) return NotFound(new { message = "Campaign not found" });
            if (!CanManageEvent(campaign.Event, userId)) return Forbid();
            if (campaign.Status == "Cancelled" || campaign.Status == "Reported")
                return BadRequest(new { message = "Cannot edit cancelled or reported campaign" });

            var validation = ValidateCampaign(dto, requireReceiveInfo: campaign.Status == "Open");
            if (validation != null) return BadRequest(new { message = validation });

            campaign.Title = dto.Title.Trim();
            campaign.Description = dto.Description.Trim();
            campaign.TargetAmount = dto.TargetAmount;
            campaign.MinimumAmount = dto.MinimumAmount;
            campaign.StartDate = dto.StartDate;
            campaign.EndDate = dto.EndDate;
            campaign.ReceiveInfo = dto.ReceiveInfo?.Trim() ?? "";
            campaign.TransparencyNote = dto.TransparencyNote?.Trim() ?? "";
            campaign.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SupportCampaign.Update", "SupportCampaign", campaign.Id, $"Status={campaign.Status};Target={campaign.TargetAmount:0.##}");

            return Ok(campaign);
        }

        [HttpPut("api/support-campaigns/{campaignId}/open"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public Task<IActionResult> Open(int campaignId) => ChangeCampaignStatus(campaignId, "Open");

        [HttpPut("api/support-campaigns/{campaignId}/close"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public Task<IActionResult> Close(int campaignId) => ChangeCampaignStatus(campaignId, "Closed");

        [HttpPut("api/support-campaigns/{campaignId}/cancel"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public Task<IActionResult> CancelCampaign(int campaignId) => ChangeCampaignStatus(campaignId, "Cancelled");

        [HttpPost("api/support-campaigns/{campaignId}/report"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> ReportCampaign(int campaignId, [FromBody] FinancialReportDto dto)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var campaign = await _context.SupportCampaigns
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.Id == campaignId);
            if (campaign == null) return NotFound(new { message = "Campaign not found" });
            if (!CanManageEvent(campaign.Event, userId)) return Forbid();
            if (campaign.Status == "Cancelled") return BadRequest(new { message = "Cancelled campaign cannot be reported" });

            var validation = ValidateReport(dto);
            if (validation != null) return BadRequest(new { message = validation });

            campaign.UsedAmount = dto.UsedAmount;
            campaign.ReportSummary = dto.Summary.Trim();
            campaign.ExpenseDetails = dto.ExpenseDetails?.Trim() ?? "";
            campaign.ReportAttachmentUrl = dto.AttachmentUrl?.Trim() ?? "";
            campaign.ReportedAt = DateTime.UtcNow;
            campaign.ReportedBy = userId;
            campaign.Status = "Reported";
            campaign.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SupportCampaign.Report", "SupportCampaign", campaign.Id, $"UsedAmount={campaign.UsedAmount:0.##}");

            return Ok(campaign);
        }

        [HttpGet("api/support-campaigns/{campaignId}/donations"), Authorize(Roles = "Organizer,Admin")]
        public async Task<IActionResult> GetCampaignDonations(int campaignId)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var campaign = await _context.SupportCampaigns
                .AsNoTracking()
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.Id == campaignId);
            if (campaign == null) return NotFound(new { message = "Campaign not found" });
            if (!CanManageEvent(campaign.Event, userId)) return Forbid();

            var donations = await _context.IndividualDonations
                .AsNoTracking()
                .Include(d => d.User)
                .Where(d => d.CampaignId == campaignId)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.CampaignId,
                    d.UserId,
                    userName = d.User.Name ?? d.User.UserName,
                    d.Amount,
                    d.DisplayName,
                    d.Phone,
                    d.Email,
                    d.Note,
                    d.IsAnonymous,
                    d.ProofImageUrl,
                    d.Status,
                    d.ConfirmedBy,
                    d.ConfirmedAt,
                    d.RejectedReason,
                    d.CreatedAt,
                    d.UpdatedAt
                })
                .ToListAsync();

            return Ok(donations);
        }

        [HttpPost("api/support-campaigns/{campaignId}/donations"), Authorize]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Donate(int campaignId, [FromBody] IndividualDonationDto dto)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var campaign = await _context.SupportCampaigns
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.Id == campaignId);
            if (campaign == null) return NotFound(new { message = "Campaign not found" });
            if (campaign.Status != "Open") return BadRequest(new { message = "Campaign is not open" });
            if (campaign.Event.Status != "Approved") return BadRequest(new { message = "Only approved events can receive donations" });
            if (DateTime.UtcNow < campaign.StartDate || DateTime.UtcNow > campaign.EndDate)
                return BadRequest(new { message = "Campaign is outside its donation window" });

            var validation = ValidateDonation(dto);
            if (validation != null) return BadRequest(new { message = validation });
            if (campaign.MinimumAmount.HasValue && dto.Amount < campaign.MinimumAmount.Value)
                return BadRequest(new { message = "Donation amount must be at least the campaign minimum amount" });

            var donation = new IndividualDonation
            {
                CampaignId = campaignId,
                UserId = userId,
                Amount = dto.Amount,
                DisplayName = dto.IsAnonymous ? "" : dto.DisplayName.Trim(),
                Phone = dto.Phone?.Trim() ?? "",
                Email = dto.Email?.Trim() ?? "",
                Note = dto.Note?.Trim() ?? "",
                IsAnonymous = dto.IsAnonymous,
                ProofImageUrl = dto.ProofImageUrl?.Trim() ?? "",
                Status = "PendingConfirmation",
                CreatedAt = DateTime.UtcNow
            };

            _context.IndividualDonations.Add(donation);
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "IndividualDonation.Create", "IndividualDonation", donation.Id, $"CampaignId={campaignId};Amount={donation.Amount:0.##}");

            return Ok(donation);
        }

        [HttpGet("api/donations/my"), Authorize]
        public async Task<IActionResult> GetMyDonations()
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var donations = await _context.IndividualDonations
                .AsNoTracking()
                .Include(d => d.Campaign).ThenInclude(c => c.Event)
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.CampaignId,
                    campaignTitle = d.Campaign.Title,
                    eventId = d.Campaign.EventId,
                    eventTitle = d.Campaign.Event.Title,
                    d.Amount,
                    d.DisplayName,
                    d.IsAnonymous,
                    d.Note,
                    d.Status,
                    d.RejectedReason,
                    d.CreatedAt,
                    d.ConfirmedAt
                })
                .ToListAsync();

            return Ok(donations);
        }

        [HttpPut("api/donations/{donationId}/confirm"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public Task<IActionResult> ConfirmDonation(int donationId) => ChangeDonationStatus(donationId, "Confirmed", null);

        [HttpPut("api/donations/{donationId}/reject"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public Task<IActionResult> RejectDonation(int donationId, [FromBody] DonationStatusDto dto) => ChangeDonationStatus(donationId, "Rejected", dto?.Reason);

        [HttpPut("api/donations/{donationId}/cancel"), Authorize]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> CancelDonation(int donationId)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var donation = await _context.IndividualDonations
                .Include(d => d.Campaign).ThenInclude(c => c.Event)
                .FirstOrDefaultAsync(d => d.Id == donationId);
            if (donation == null) return NotFound(new { message = "Donation not found" });
            if (donation.Status != "PendingConfirmation")
                return BadRequest(new { message = "Only pending donations can be cancelled" });

            var canManage = CanManageEvent(donation.Campaign.Event, userId);
            if (!canManage && donation.UserId != userId) return Forbid();

            donation.Status = "Cancelled";
            donation.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "IndividualDonation.Cancel", "IndividualDonation", donation.Id, $"CampaignId={donation.CampaignId}");

            return Ok(donation);
        }

        private async Task<IActionResult> ChangeCampaignStatus(int campaignId, string status)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var campaign = await _context.SupportCampaigns.Include(c => c.Event).FirstOrDefaultAsync(c => c.Id == campaignId);
            if (campaign == null) return NotFound(new { message = "Campaign not found" });
            if (!CanManageEvent(campaign.Event, userId)) return Forbid();

            if (status == "Open")
            {
                var validation = CanOpenCampaign(campaign.Event, campaign);
                if (validation != null) return BadRequest(new { message = validation });
            }

            campaign.Status = status;
            campaign.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, $"SupportCampaign.{status}", "SupportCampaign", campaign.Id, $"EventId={campaign.EventId}");

            return Ok(campaign);
        }

        private async Task<IActionResult> ChangeDonationStatus(int donationId, string status, string? reason)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var donation = await _context.IndividualDonations
                .Include(d => d.Campaign).ThenInclude(c => c.Event)
                .FirstOrDefaultAsync(d => d.Id == donationId);
            if (donation == null) return NotFound(new { message = "Donation not found" });
            if (!CanManageEvent(donation.Campaign.Event, userId)) return Forbid();
            if (donation.Status != "PendingConfirmation")
                return BadRequest(new { message = "Only pending donations can be updated" });

            donation.Status = status;
            donation.UpdatedAt = DateTime.UtcNow;
            if (status == "Confirmed")
            {
                donation.ConfirmedBy = userId;
                donation.ConfirmedAt = DateTime.UtcNow;
                donation.RejectedReason = "";
            }
            else if (status == "Rejected")
            {
                donation.RejectedReason = reason?.Trim() ?? "";
            }

            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, $"IndividualDonation.{status}", "IndividualDonation", donation.Id, $"CampaignId={donation.CampaignId};Amount={donation.Amount:0.##}");

            return Ok(donation);
        }

        private async Task<object> BuildCampaignSummary(int campaignId)
        {
            var donations = await _context.IndividualDonations
                .AsNoTracking()
                .Where(d => d.CampaignId == campaignId)
                .GroupBy(d => 1)
                .Select(g => new
                {
                    confirmedAmount = g.Where(d => d.Status == "Confirmed").Sum(d => (decimal?)d.Amount) ?? 0,
                    pendingAmount = g.Where(d => d.Status == "PendingConfirmation").Sum(d => (decimal?)d.Amount) ?? 0,
                    confirmedCount = g.Count(d => d.Status == "Confirmed"),
                    pendingCount = g.Count(d => d.Status == "PendingConfirmation")
                })
                .FirstOrDefaultAsync();

            return donations ?? new { confirmedAmount = 0m, pendingAmount = 0m, confirmedCount = 0, pendingCount = 0 };
        }

        private bool CanManageEvent(Entities.Event ev, int? userId)
        {
            if (userId == null) return false;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return role == "Admin" || ev.OrganizerId == userId.Value;
        }

        private int? GetUserIdOrNull()
        {
            return int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId) ? userId : null;
        }

        private bool TryGetUserId(out int userId)
        {
            return int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out userId);
        }

        private static string NormalizeCampaignStatus(string? status, string fallback)
        {
            return status?.Trim() switch
            {
                "Open" => "Open",
                "Closed" => "Closed",
                "Cancelled" => "Cancelled",
                "Reported" => "Reported",
                _ => fallback
            };
        }

        private static string? ValidateCampaign(SupportCampaignDto dto, bool requireReceiveInfo)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || dto.Title.Trim().Length < 3 || dto.Title.Trim().Length > 200)
                return "Campaign title must be 3-200 characters";
            if (string.IsNullOrWhiteSpace(dto.Description) || dto.Description.Trim().Length < 10 || dto.Description.Trim().Length > 2000)
                return "Campaign description must be 10-2000 characters";
            if (dto.TargetAmount <= 0)
                return "Target amount must be greater than zero";
            if (dto.MinimumAmount.HasValue && (dto.MinimumAmount < 0 || dto.MinimumAmount > dto.TargetAmount))
                return "Minimum amount must be between zero and target amount";
            if (dto.EndDate <= dto.StartDate)
                return "End date must be after start date";
            if (requireReceiveInfo && string.IsNullOrWhiteSpace(dto.ReceiveInfo))
                return "Receive info is required to open a campaign";
            if ((dto.ReceiveInfo?.Length ?? 0) > 1000 || (dto.TransparencyNote?.Length ?? 0) > 1000)
                return "Receive info and transparency note must be at most 1000 characters";
            return null;
        }

        private static string? CanOpenCampaign(Entities.Event ev, SupportCampaign campaign)
        {
            if (ev.Status != "Approved")
                return "Only approved events can open support campaigns";
            if (string.IsNullOrWhiteSpace(campaign.ReceiveInfo))
                return "Receive info is required to open a campaign";
            if (campaign.TargetAmount <= 0)
                return "Target amount must be greater than zero";
            if (campaign.EndDate <= campaign.StartDate)
                return "End date must be after start date";
            return null;
        }

        private static string? ValidateDonation(IndividualDonationDto dto)
        {
            if (dto.Amount <= 0)
                return "Donation amount must be greater than zero";
            if (!dto.IsAnonymous && string.IsNullOrWhiteSpace(dto.DisplayName))
                return "Display name is required when donation is public";
            if ((dto.DisplayName?.Length ?? 0) > 120 || (dto.Phone?.Length ?? 0) > 30 || (dto.Email?.Length ?? 0) > 120)
                return "Donation contact fields are too long";
            if ((dto.Note?.Length ?? 0) > 500 || (dto.ProofImageUrl?.Length ?? 0) > 500)
                return "Donation note or proof URL is too long";
            return null;
        }

        private static string? ValidateReport(FinancialReportDto dto)
        {
            if (dto.UsedAmount < 0)
                return "Used amount must be zero or greater";
            if (string.IsNullOrWhiteSpace(dto.Summary) || dto.Summary.Trim().Length > 2000)
                return "Report summary is required and must be at most 2000 characters";
            if ((dto.ExpenseDetails?.Length ?? 0) > 4000 || (dto.AttachmentUrl?.Length ?? 0) > 500)
                return "Report details or attachment URL is too long";
            return null;
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

    public class SupportCampaignDto
    {
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal TargetAmount { get; set; }
        public decimal? MinimumAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? ReceiveInfo { get; set; }
        public string? TransparencyNote { get; set; }
        public string? Status { get; set; }
    }

    public class IndividualDonationDto
    {
        public decimal Amount { get; set; }
        public string DisplayName { get; set; } = "";
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Note { get; set; }
        public bool IsAnonymous { get; set; }
        public string? ProofImageUrl { get; set; }
    }

    public class DonationStatusDto
    {
        public string? Reason { get; set; }
    }

    public class FinancialReportDto
    {
        public decimal UsedAmount { get; set; }
        public string Summary { get; set; } = "";
        public string? ExpenseDetails { get; set; }
        public string? AttachmentUrl { get; set; }
    }
}
