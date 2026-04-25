using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly MySqlDbContext _context;

        public DashboardController(MySqlDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (role == "Admin")
            {
                var totalUsers = await _context.Users.CountAsync();
                var pendingEvents = await _context.Events.CountAsync(e => e.Status == "Pending");
                var totalEvents = await _context.Events.CountAsync();
                var totalRegistrations = await _context.Registrations.CountAsync();
                var totalCertificates = await _context.Certificates.CountAsync();
                return Ok(new { totalUsers, pendingEvents, totalEvents, totalRegistrations, totalCertificates });
            }
            else if (role == "Organizer")
            {
                var myEvents = await _context.Events.Where(e => e.OrganizerId == userId).ToListAsync();
                var eventIds = myEvents.Select(e => e.Id).ToList();
                var pendingRegistrations = await _context.Registrations
                    .CountAsync(r => eventIds.Contains(r.EventId) && r.Status == "Pending");
                var totalVolunteers = await _context.Registrations
                    .CountAsync(r => eventIds.Contains(r.EventId) && r.Status == "Confirmed");
                return Ok(new
                {
                    totalEvents = myEvents.Count,
                    approvedEvents = myEvents.Count(e => e.Status == "Approved"),
                    completedEvents = myEvents.Count(e => e.Status == "Completed"),
                    pendingRegistrations,
                    totalVolunteers,
                    recentEvents = myEvents.OrderByDescending(e => e.CreatedAt).Take(5)
                });
            }
            else if (role == "Sponsor")
            {
                var mySponsors = await _context.EventSponsors
                    .Include(s => s.Event)
                    .Where(s => s.SponsorId == userId)
                    .OrderByDescending(s => s.SponsoredAt)
                    .ToListAsync();
                return Ok(new { totalSponsored = mySponsors.Count, sponsors = mySponsors });
            }
            else // Volunteer
            {
                var myRegistrations = await _context.Registrations
                    .Include(r => r.Event)
                    .Where(r => r.UserId == userId)
                    .ToListAsync();
                var profile = await _context.VolunteerProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
                var myBadges = await _context.UserBadges
                    .Include(ub => ub.Badge)
                    .Where(ub => ub.UserId == userId)
                    .OrderByDescending(ub => ub.AwardedAt)
                    .Take(5)
                    .ToListAsync();
                var upcomingEvents = await _context.Events
                    .Where(e => e.Status == "Approved" && e.StartDate > DateTime.UtcNow)
                    .OrderBy(e => e.StartDate)
                    .Take(5)
                    .ToListAsync();
                return Ok(new
                {
                    totalRegistrations = myRegistrations.Count,
                    attendedEvents = myRegistrations.Count(r => r.IsAttended),
                    totalHours = profile?.TotalVolunteerHours ?? 0,
                    recentBadges = myBadges,
                    upcomingEvents
                });
            }
        }
    }
}
