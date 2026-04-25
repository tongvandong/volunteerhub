using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Repository;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace BaseCore.APIService.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly MySqlDbContext _context;

        public AdminController(MySqlDbContext context)
        {
            _context = context;
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
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { id = user.Id, isActive = user.IsActive });
        }

        [HttpGet("export/events")]
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
                var csv = new StringBuilder();
                csv.AppendLine("Id,Title,Status,Location,StartDate,EndDate,MaxParticipants,CurrentParticipants,Category,Organizer,CreatedAt");
                foreach (var e in events)
                    csv.AppendLine($"{e.Id},{EscapeCsv(e.Title)},{e.Status},{EscapeCsv(e.Location)},{e.StartDate:yyyy-MM-dd},{e.EndDate:yyyy-MM-dd},{e.MaxParticipants},{e.CurrentParticipants},{EscapeCsv(e.Category)},{EscapeCsv(e.Organizer)},{e.CreatedAt:yyyy-MM-dd}");
                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "events.csv");
            }

            return Ok(events);
        }

        [HttpGet("export/users")]
        public async Task<IActionResult> ExportUsers([FromQuery] string format = "json")
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.UserName, u.Name, u.Email, u.UserType, u.IsActive })
                .ToListAsync();

            if (format.ToLower() == "csv")
            {
                var csv = new StringBuilder();
                csv.AppendLine("Id,Username,Name,Email,UserType,IsActive");
                foreach (var u in users)
                    csv.AppendLine($"{u.Id},{EscapeCsv(u.UserName)},{EscapeCsv(u.Name)},{EscapeCsv(u.Email)},{u.UserType},{u.IsActive}");
                return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "users.csv");
            }

            return Ok(users);
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
