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
    public class SponsorshipProposalController : ControllerBase
    {
        private readonly MySqlDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public SponsorshipProposalController(MySqlDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        [HttpGet("api/sponsors/users"), Authorize(Roles = "Organizer,Admin")]
        public async Task<IActionResult> GetSponsorUsers()
        {
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => u.UserType == 2 && u.IsActive)
                .OrderBy(u => u.Name)
                .Select(u => new { u.Id, u.Name, u.UserName, u.Email, u.Phone })
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("api/events/{eventId}/sponsorship-proposals"), Authorize(Roles = "Organizer,Admin,Sponsor")]
        public async Task<IActionResult> GetByEvent(int eventId)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var ev = await _context.Events.AsNoTracking().FirstOrDefaultAsync(e => e.Id == eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });

            var role = GetRole();
            var query = BaseProposalQuery().Where(p => p.EventId == eventId);
            if (role == "Organizer" && ev.OrganizerId != userId) return Forbid();
            if (role == "Sponsor") query = query.Where(p => p.SponsorId == userId);

            var proposals = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
            return Ok(proposals.Select(ToDto).ToList());
        }

        [HttpGet("api/sponsorship-proposals/my"), Authorize(Roles = "Organizer,Sponsor,Admin")]
        public async Task<IActionResult> GetMy()
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var role = GetRole();
            var query = BaseProposalQuery();

            if (role == "Sponsor") query = query.Where(p => p.SponsorId == userId);
            else if (role == "Organizer") query = query.Where(p => p.OrganizerId == userId);

            var proposals = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
            return Ok(proposals.Select(ToDto).ToList());
        }

        [HttpPost("api/events/{eventId}/sponsorship-proposals/organizer-request"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> OrganizerRequest(int eventId, [FromBody] SponsorshipProposalDto dto)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (!CanManageEvent(ev, userId)) return Forbid();
            if (ev.Status is "Rejected" or "Cancelled") return BadRequest(new { message = "Cannot sponsor rejected or cancelled events" });

            var sponsor = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.SponsorId && u.UserType == 2 && u.IsActive);
            if (sponsor == null) return BadRequest(new { message = "Sponsor account not found" });

            var validation = ValidateProposal(dto, "OrganizerRequest");
            if (validation != null) return BadRequest(new { message = validation });

            var proposal = new SponsorshipProposal
            {
                EventId = eventId,
                SponsorId = sponsor.Id,
                OrganizerId = ev.OrganizerId,
                Type = "OrganizerRequest",
                Title = dto.Title.Trim(),
                Message = dto.Message.Trim(),
                RequestedAmount = dto.RequestedAmount,
                Purpose = dto.Purpose?.Trim() ?? "",
                SponsorBenefits = dto.SponsorBenefits?.Trim() ?? "",
                AttachmentUrl = dto.AttachmentUrl?.Trim() ?? "",
                Status = "Pending",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.SponsorshipProposals.Add(proposal);
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SponsorshipProposal.OrganizerRequest", "SponsorshipProposal", proposal.Id, $"EventId={eventId};SponsorId={sponsor.Id};Amount={proposal.RequestedAmount:0.##}");

            return Ok(await GetProposalDto(proposal.Id));
        }

        [HttpPost("api/events/{eventId}/sponsorship-proposals/sponsor-offer"), Authorize(Roles = "Sponsor")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> SponsorOffer(int eventId, [FromBody] SponsorshipProposalDto dto)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == eventId);
            if (ev == null) return NotFound(new { message = "Event not found" });
            if (ev.Status != "Approved") return BadRequest(new { message = "Only approved events can receive sponsor offers" });

            var validation = ValidateProposal(dto, "SponsorOffer");
            if (validation != null) return BadRequest(new { message = validation });

            var sponsor = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            var proposal = new SponsorshipProposal
            {
                EventId = eventId,
                SponsorId = userId,
                OrganizerId = ev.OrganizerId,
                Type = "SponsorOffer",
                Title = dto.Title.Trim(),
                Message = dto.Message.Trim(),
                OfferedAmount = dto.OfferedAmount,
                Purpose = dto.Purpose?.Trim() ?? "",
                PublicSponsorName = string.IsNullOrWhiteSpace(dto.PublicSponsorName) ? sponsor?.Name ?? "" : dto.PublicSponsorName.Trim(),
                PublicMessage = dto.PublicMessage?.Trim() ?? "",
                LogoUrl = dto.LogoUrl?.Trim() ?? "",
                AttachmentUrl = dto.AttachmentUrl?.Trim() ?? "",
                Status = "Pending",
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.SponsorshipProposals.Add(proposal);
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SponsorshipProposal.SponsorOffer", "SponsorshipProposal", proposal.Id, $"EventId={eventId};Amount={proposal.OfferedAmount:0.##}");

            return Ok(await GetProposalDto(proposal.Id));
        }

        [HttpPut("api/sponsorship-proposals/{proposalId}/accept"), Authorize(Roles = "Organizer,Sponsor,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public Task<IActionResult> Accept(int proposalId, [FromBody] ProposalResponseDto dto) => Respond(proposalId, "Accepted", dto?.ResponseMessage);

        [HttpPut("api/sponsorship-proposals/{proposalId}/reject"), Authorize(Roles = "Organizer,Sponsor,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public Task<IActionResult> Reject(int proposalId, [FromBody] ProposalResponseDto dto) => Respond(proposalId, "Rejected", dto?.ResponseMessage);

        [HttpPut("api/sponsorship-proposals/{proposalId}/cancel"), Authorize(Roles = "Organizer,Sponsor,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Cancel(int proposalId)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var proposal = await BaseProposalQuery().FirstOrDefaultAsync(p => p.Id == proposalId);
            if (proposal == null) return NotFound(new { message = "Proposal not found" });
            if (!CanAccessProposal(proposal, userId)) return Forbid();
            if (proposal.Status != "Pending") return BadRequest(new { message = "Only pending proposals can be cancelled" });

            proposal.Status = "Cancelled";
            proposal.CancelledAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SponsorshipProposal.Cancel", "SponsorshipProposal", proposal.Id);
            return Ok(ToDto(proposal));
        }

        [HttpPut("api/sponsorship-proposals/{proposalId}/received"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> MarkReceived(int proposalId, [FromBody] ProposalReceivedDto? dto = null)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var proposal = await BaseProposalQuery().FirstOrDefaultAsync(p => p.Id == proposalId);
            if (proposal == null) return NotFound(new { message = "Proposal not found" });
            if (!CanManageEvent(proposal.Event, userId)) return Forbid();
            if (proposal.Status != "Accepted") return BadRequest(new { message = "Only accepted proposals can be marked as received" });
            if (dto != null && dto.ActualReceivedAmount.HasValue && dto.ActualReceivedAmount.Value < 0)
                return BadRequest(new { message = "Actual received amount cannot be negative" });

            proposal.Status = "Received";
            proposal.ReceivedAt = DateTime.UtcNow;
            proposal.ReceivedBy = userId;
            var pledged = ResolveAmount(proposal);
            var actual = dto?.ActualReceivedAmount ?? pledged;
            proposal.ActualReceivedAmount = actual;

            if (proposal.LegacyEventSponsorId == null)
            {
                var legacy = new EventSponsor
                {
                    EventId = proposal.EventId,
                    SponsorId = proposal.SponsorId,
                    ContributionType = "Financial",
                    Amount = actual,
                    Note = !string.IsNullOrWhiteSpace(proposal.PublicSponsorName)
                        ? proposal.PublicSponsorName
                        : proposal.PublicMessage.Length > 0 ? proposal.PublicMessage : proposal.Title,
                    SponsoredAt = DateTime.UtcNow
                };
                _context.EventSponsors.Add(legacy);
                await _context.SaveChangesAsync();
                proposal.LegacyEventSponsorId = legacy.Id;
            }
            else
            {
                // Keep legacy EventSponsor in sync with the actual amount
                var legacy = await _context.EventSponsors.FindAsync(proposal.LegacyEventSponsorId.Value);
                if (legacy != null) legacy.Amount = actual;
            }

            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SponsorshipProposal.Received", "SponsorshipProposal", proposal.Id, $"EventId={proposal.EventId};Pledged={pledged:0.##};Actual={actual:0.##}");
            return Ok(await GetProposalDto(proposal.Id));
        }

        [HttpPut("api/sponsorship-proposals/{proposalId}/admin-revert-to-pending"), Authorize(Roles = "Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> AdminRevertToPending(int proposalId, [FromBody] ProposalResponseDto? dto)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var proposal = await BaseProposalQuery().FirstOrDefaultAsync(p => p.Id == proposalId);
            if (proposal == null) return NotFound(new { message = "Proposal not found" });
            if (proposal.Status == "Received" || proposal.Status == "Reported")
                return BadRequest(new { message = "Cannot revert a received or reported proposal. Use Report to adjust figures." });
            if (proposal.Status == "Pending")
                return BadRequest(new { message = "Proposal is already pending" });

            proposal.Status = "Pending";
            proposal.RespondedAt = null;
            proposal.CancelledAt = null;
            proposal.ResponseMessage = dto?.ResponseMessage?.Trim() ?? proposal.ResponseMessage;
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SponsorshipProposal.AdminRevertToPending", "SponsorshipProposal", proposal.Id);
            return Ok(ToDto(proposal));
        }

        [HttpPost("api/sponsorship-proposals/{proposalId}/report"), Authorize(Roles = "Organizer,Admin")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> Report(int proposalId, [FromBody] ProposalReportDto dto)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var proposal = await BaseProposalQuery().FirstOrDefaultAsync(p => p.Id == proposalId);
            if (proposal == null) return NotFound(new { message = "Proposal not found" });
            if (!CanManageEvent(proposal.Event, userId)) return Forbid();
            if (proposal.Status is not ("Received" or "Reported")) return BadRequest(new { message = "Only received proposals can be reported" });

            var receivedAmount = proposal.ActualReceivedAmount ?? ResolveAmount(proposal);
            var validation = ValidateReport(dto, receivedAmount);
            if (validation != null) return BadRequest(new { message = validation });

            proposal.UsedAmount = dto.UsedAmount;
            proposal.ReportSummary = dto.Summary.Trim();
            proposal.ExpenseDetails = dto.ExpenseDetails?.Trim() ?? "";
            proposal.ReportAttachmentUrl = dto.AttachmentUrl?.Trim() ?? "";
            proposal.ReportedAt = DateTime.UtcNow;
            proposal.Status = "Reported";

            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, "SponsorshipProposal.Report", "SponsorshipProposal", proposal.Id, $"UsedAmount={proposal.UsedAmount:0.##}");
            return Ok(await GetProposalDto(proposal.Id));
        }

        private async Task<IActionResult> Respond(int proposalId, string status, string? message)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var proposal = await BaseProposalQuery().FirstOrDefaultAsync(p => p.Id == proposalId);
            if (proposal == null) return NotFound(new { message = "Proposal not found" });
            if (proposal.Status != "Pending") return BadRequest(new { message = "Only pending proposals can be answered" });

            var role = GetRole();
            var allowed = role == "Admin"
                || (proposal.Type == "OrganizerRequest" && proposal.SponsorId == userId)
                || (proposal.Type == "SponsorOffer" && proposal.Event.OrganizerId == userId);
            if (!allowed) return Forbid();

            proposal.Status = status;
            proposal.RespondedAt = DateTime.UtcNow;
            proposal.ResponseMessage = message?.Trim() ?? "";
            await _context.SaveChangesAsync();
            await RecordAuditAsync(userId, $"SponsorshipProposal.{status}", "SponsorshipProposal", proposal.Id, $"Type={proposal.Type}");

            return Ok(ToDto(proposal));
        }

        private IQueryable<SponsorshipProposal> BaseProposalQuery()
        {
            return _context.SponsorshipProposals
                .Include(p => p.Event)
                .Include(p => p.Sponsor)
                .Include(p => p.Organizer)
                .Include(p => p.LegacyEventSponsor);
        }

        private async Task<object?> GetProposalDto(int proposalId)
        {
            var proposal = await BaseProposalQuery().FirstAsync(p => p.Id == proposalId);
            return ToDto(proposal);
        }

        private static object ToDto(SponsorshipProposal p)
        {
            return new
            {
                p.Id,
                p.EventId,
                eventTitle = p.Event?.Title,
                eventStatus = p.Event?.Status,
                eventLocation = p.Event?.Location,
                eventStartDate = p.Event?.StartDate,
                p.SponsorId,
                sponsorName = p.Sponsor?.Name ?? p.Sponsor?.UserName,
                sponsorEmail = p.Sponsor?.Email,
                p.OrganizerId,
                organizerName = p.Organizer?.Name ?? p.Organizer?.UserName,
                p.Type,
                p.Title,
                p.Message,
                p.RequestedAmount,
                p.OfferedAmount,
                amount = ResolveAmount(p),
                p.ActualReceivedAmount,
                p.Purpose,
                p.SponsorBenefits,
                p.PublicSponsorName,
                p.PublicMessage,
                p.LogoUrl,
                p.AttachmentUrl,
                p.ResponseMessage,
                p.Status,
                p.CreatedBy,
                p.CreatedAt,
                p.RespondedAt,
                p.ReceivedAt,
                p.ReceivedBy,
                p.ReportedAt,
                p.CancelledAt,
                p.LegacyEventSponsorId,
                p.UsedAmount,
                p.ReportSummary,
                p.ExpenseDetails,
                p.ReportAttachmentUrl
            };
        }

        private bool CanAccessProposal(SponsorshipProposal proposal, int userId)
        {
            var role = GetRole();
            return role == "Admin" || proposal.SponsorId == userId || proposal.OrganizerId == userId;
        }

        private bool CanManageEvent(Entities.Event ev, int userId)
        {
            var role = GetRole();
            return role == "Admin" || ev.OrganizerId == userId;
        }

        private static string? ValidateProposal(SponsorshipProposalDto dto, string type)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || dto.Title.Trim().Length > 200) return "Proposal title is required and must be at most 200 characters";
            if (string.IsNullOrWhiteSpace(dto.Message) || dto.Message.Trim().Length > 2000) return "Proposal message is required and must be at most 2000 characters";
            if (type == "OrganizerRequest" && (!dto.RequestedAmount.HasValue || dto.RequestedAmount <= 0)) return "Requested amount must be greater than zero";
            if (type == "SponsorOffer" && (!dto.OfferedAmount.HasValue || dto.OfferedAmount <= 0)) return "Offered amount must be greater than zero";
            if ((dto.Purpose?.Length ?? 0) > 1000 || (dto.SponsorBenefits?.Length ?? 0) > 1000 || (dto.PublicMessage?.Length ?? 0) > 1000) return "Proposal text fields are too long";
            return null;
        }

        private static string? ValidateReport(ProposalReportDto dto, decimal receivedAmount)
        {
            if (dto.UsedAmount < 0) return "Used amount must be zero or greater";
            if (dto.UsedAmount > receivedAmount) return "Used amount cannot exceed received sponsorship amount";
            if (string.IsNullOrWhiteSpace(dto.Summary) || dto.Summary.Trim().Length > 2000) return "Report summary is required and must be at most 2000 characters";
            if ((dto.ExpenseDetails?.Length ?? 0) > 4000 || (dto.AttachmentUrl?.Length ?? 0) > 500) return "Report details or attachment URL is too long";
            return null;
        }

        private static decimal ResolveAmount(SponsorshipProposal p)
        {
            return p.Type == "OrganizerRequest" ? p.RequestedAmount ?? 0 : p.OfferedAmount ?? 0;
        }

        private bool TryGetUserId(out int userId)
        {
            return int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out userId);
        }

        private string? GetRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value;
        }

        private Task RecordAuditAsync(int? userId, string action, string entityType, int? entityId = null, string? metadata = null)
        {
            return _auditLogService.RecordAsync(userId, action, entityType, entityId, metadata, HttpContext.Connection.RemoteIpAddress?.ToString());
        }
    }

    public class SponsorshipProposalDto
    {
        public int SponsorId { get; set; }
        public string Title { get; set; } = "";
        public string Message { get; set; } = "";
        public decimal? RequestedAmount { get; set; }
        public decimal? OfferedAmount { get; set; }
        public string? Purpose { get; set; }
        public string? SponsorBenefits { get; set; }
        public string? PublicSponsorName { get; set; }
        public string? PublicMessage { get; set; }
        public string? LogoUrl { get; set; }
        public string? AttachmentUrl { get; set; }
    }

    public class ProposalResponseDto
    {
        public string? ResponseMessage { get; set; }
    }

    public class ProposalReportDto
    {
        public decimal UsedAmount { get; set; }
        public string Summary { get; set; } = "";
        public string? ExpenseDetails { get; set; }
        public string? AttachmentUrl { get; set; }
    }

    public class ProposalReceivedDto
    {
        public decimal? ActualReceivedAmount { get; set; }
    }
}
