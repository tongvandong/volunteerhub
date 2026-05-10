using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using BaseCore.Repository;
using BaseCore.Services.VolunteerHub;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;

namespace BaseCore.APIService.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly MySqlDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public AdminController(MySqlDbContext context, IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? keyword, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.Users.AsQueryable();
            if (!string.IsNullOrEmpty(keyword))
                query = query.Where(u => u.UserName.Contains(keyword) || u.Name.Contains(keyword) || u.Email.Contains(keyword));

            var total = await query.CountAsync();
            var users = await query.OrderByDescending(u => u.Id)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(u => new { u.Id, u.UserName, u.Name, u.Email, u.UserType, u.IsActive })
                .ToListAsync();

            return Ok(new { items = users, totalCount = total, page, pageSize, totalPages = (int)Math.Ceiling((double)total / pageSize) });
        }

        [HttpPut("users/{id}/toggle-status")]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();
            await RecordAuditAsync("Admin.User.ToggleStatus", "User", user.Id, $"IsActive={user.IsActive}");
            return Ok(new { id = user.Id, isActive = user.IsActive });
        }

        [HttpGet("export/events")]
        [EnableRateLimiting("read-sensitive")]
        public async Task<IActionResult> ExportEvents([FromQuery] string format = "json")
        {
            var events = await _context.Events
                .Include(e => e.Category)
                .Include(e => e.Organizer)
                .Select(e => new
                {
                    e.Id, e.Title, e.Status, e.Location,
                    e.StartDate, e.EndDate, e.MaxParticipants, e.CurrentParticipants,
                    Category = e.Category != null ? e.Category.Name : "",
                    Organizer = e.Organizer != null ? e.Organizer.Name : "",
                    e.CreatedAt
                })
                .ToListAsync();

            if (format.ToLower() == "csv")
            {
                await RecordAuditAsync("Admin.Export.Events", "Event", null, "Format=csv");
                var csv = new StringBuilder();
                csv.AppendLine("Id,Title,Status,Location,StartDate,EndDate,MaxParticipants,CurrentParticipants,Category,Organizer,CreatedAt");
                foreach (var e in events)
                    csv.AppendLine($"{e.Id},{EscapeCsv(e.Title)},{e.Status},{EscapeCsv(e.Location)},{e.StartDate:yyyy-MM-dd},{e.EndDate:yyyy-MM-dd},{e.MaxParticipants},{e.CurrentParticipants},{EscapeCsv(e.Category)},{EscapeCsv(e.Organizer)},{e.CreatedAt:yyyy-MM-dd}");
                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "events.csv");
            }

            await RecordAuditAsync("Admin.Export.Events", "Event", null, "Format=json");
            return Ok(events);
        }

        [HttpGet("export/users")]
        [EnableRateLimiting("read-sensitive")]
        public async Task<IActionResult> ExportUsers([FromQuery] string format = "json")
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.UserName, u.Name, u.Email, u.UserType, u.IsActive })
                .ToListAsync();

            if (format.ToLower() == "csv")
            {
                await RecordAuditAsync("Admin.Export.Users", "User", null, "Format=csv");
                var csv = new StringBuilder();
                csv.AppendLine("Id,Username,Name,Email,UserType,IsActive");
                foreach (var u in users)
                    csv.AppendLine($"{u.Id},{EscapeCsv(u.UserName)},{EscapeCsv(u.Name)},{EscapeCsv(u.Email)},{u.UserType},{u.IsActive}");
                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "users.csv");
            }

            await RecordAuditAsync("Admin.Export.Users", "User", null, "Format=json");
            return Ok(users);
        }

        [HttpGet("finance/overview")]
        public async Task<IActionResult> GetFinanceOverview()
        {
            var donationConfirmedAmount = await _context.IndividualDonations
                .Where(d => d.Status == "Confirmed")
                .SumAsync(d => (decimal?)d.Amount) ?? 0;
            var donationPendingAmount = await _context.IndividualDonations
                .Where(d => d.Status == "PendingConfirmation")
                .SumAsync(d => (decimal?)d.Amount) ?? 0;
            var sponsorshipReceivedAmount = await _context.SponsorshipProposals
                .Where(p => p.Status == "Received" || p.Status == "Reported")
                .SumAsync(p => p.Type == "OrganizerRequest" ? p.RequestedAmount ?? 0 : p.OfferedAmount ?? 0);

            return Ok(new
            {
                totals = new
                {
                    campaigns = await _context.SupportCampaigns.CountAsync(),
                    donations = await _context.IndividualDonations.CountAsync(),
                    proposals = await _context.SponsorshipProposals.CountAsync(),
                    donationConfirmedAmount,
                    donationPendingAmount,
                    sponsorshipReceivedAmount,
                    financialConfirmedAmount = donationConfirmedAmount + sponsorshipReceivedAmount
                },
                recentDonations = await _context.IndividualDonations
                    .Include(d => d.Campaign).ThenInclude(c => c.Event)
                    .OrderByDescending(d => d.CreatedAt)
                    .Take(10)
                    .Select(d => new { d.Id, d.Amount, d.Status, d.DisplayName, campaign = d.Campaign.Title, eventTitle = d.Campaign.Event.Title, d.CreatedAt })
                    .ToListAsync(),
                recentProposals = await _context.SponsorshipProposals
                    .Include(p => p.Event)
                    .Include(p => p.Sponsor)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(10)
                    .Select(p => new { p.Id, p.Title, p.Type, p.Status, sponsor = p.Sponsor.Name, eventTitle = p.Event.Title, amount = p.Type == "OrganizerRequest" ? p.RequestedAmount ?? 0 : p.OfferedAmount ?? 0, p.CreatedAt })
                    .ToListAsync()
            });
        }

        [HttpGet("export/finance")]
        [EnableRateLimiting("read-sensitive")]
        public async Task<IActionResult> ExportFinance([FromQuery] string format = "json")
        {
            var campaigns = await _context.SupportCampaigns
                .Include(c => c.Event)
                .Select(c => new
                {
                    Type = "Campaign",
                    c.Id,
                    Event = c.Event.Title,
                    c.Title,
                    Counterparty = "",
                    c.Status,
                    Amount = c.Donations.Where(d => d.Status == "Confirmed").Sum(d => (decimal?)d.Amount) ?? 0,
                    c.UsedAmount,
                    c.ReportSummary,
                    c.ReportedAt,
                    c.CreatedAt
                })
                .ToListAsync();
            var proposals = await _context.SponsorshipProposals
                .Include(p => p.Event)
                .Include(p => p.Sponsor)
                .Select(p => new
                {
                    Type = "Sponsorship",
                    p.Id,
                    Event = p.Event.Title,
                    p.Title,
                    Counterparty = p.Sponsor.Name,
                    p.Status,
                    Amount = p.Type == "OrganizerRequest" ? p.RequestedAmount ?? 0 : p.OfferedAmount ?? 0,
                    p.UsedAmount,
                    p.ReportSummary,
                    p.ReportedAt,
                    p.CreatedAt
                })
                .ToListAsync();
            var rows = campaigns.Concat(proposals).OrderByDescending(x => x.CreatedAt).ToList();

            if (format.ToLower() == "csv")
            {
                await RecordAuditAsync("Admin.Export.Finance", "Finance", null, "Format=csv");
                var csv = new StringBuilder();
                csv.AppendLine("Type,Id,Event,Title,Counterparty,Status,Amount,UsedAmount,ReportSummary,ReportedAt,CreatedAt");
                foreach (var row in rows)
                    csv.AppendLine($"{row.Type},{row.Id},{EscapeCsv(row.Event)},{EscapeCsv(row.Title)},{EscapeCsv(row.Counterparty)},{row.Status},{row.Amount},{row.UsedAmount},{EscapeCsv(row.ReportSummary)},{row.ReportedAt:yyyy-MM-dd},{row.CreatedAt:yyyy-MM-dd}");
                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "finance.csv");
            }

            await RecordAuditAsync("Admin.Export.Finance", "Finance", null, "Format=json");
            return Ok(rows);
        }

        private Task RecordAuditAsync(string action, string entityType, int? entityId = null, string? metadata = null)
        {
            var userId = int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var parsedUserId)
                ? parsedUserId
                : (int?)null;

            return _auditLogService.RecordAsync(
                userId,
                action,
                entityType,
                entityId,
                metadata,
                HttpContext.Connection.RemoteIpAddress?.ToString());
        }

        private static string EscapeCsv(string? value)
        {
            if (string.IsNullOrEmpty(value)) return "";
            if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
                return $"\"{value.Replace("\"", "\"\"")}\"";
            return value;
        }
    }
}
