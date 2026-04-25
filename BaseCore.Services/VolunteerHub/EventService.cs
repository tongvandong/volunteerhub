using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.Services.VolunteerHub
{
    public class EventService : IEventService
    {
        private readonly MySqlDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ICertificateService _certificateService;

        public EventService(MySqlDbContext context, INotificationService notificationService, ICertificateService certificateService)
        {
            _context = context;
            _notificationService = notificationService;
            _certificateService = certificateService;
        }

        public async Task<(List<Entities.Event> Items, int TotalCount)> SearchAsync(
            string? keyword, int? categoryId, string? status,
            DateTime? startDateFrom, int page, int pageSize, int? skillId = null, string? location = null)
        {
            var query = _context.Events
                .Include(e => e.Category)
                .Include(e => e.Organizer)
                .AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                var kw = keyword.ToLower();
                query = query.Where(e =>
                    e.Title.ToLower().Contains(kw) ||
                    (e.Description != null && e.Description.ToLower().Contains(kw)) ||
                    (e.Location != null && e.Location.ToLower().Contains(kw)));
            }
            if (categoryId.HasValue) query = query.Where(e => e.CategoryId == categoryId.Value);
            if (!string.IsNullOrEmpty(status)) query = query.Where(e => e.Status == status);
            if (startDateFrom.HasValue) query = query.Where(e => e.StartDate >= startDateFrom.Value);

            // Filter by required skill (JSON contains check)
            if (skillId.HasValue)
            {
                var skillStr = skillId.Value.ToString();
                query = query.Where(e => e.RequiredSkillIds != null && e.RequiredSkillIds.Contains(skillStr));
            }

            // Filter by location text
            if (!string.IsNullOrEmpty(location))
            {
                var loc = location.ToLower();
                query = query.Where(e => e.Location != null && e.Location.ToLower().Contains(loc));
            }

            var totalCount = await query.CountAsync();
            var items = await query.OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return (items, totalCount);
        }

        public async Task<List<Entities.Event>> GetByOrganizerAsync(int organizerId)
        {
            return await _context.Events
                .Include(e => e.Category)
                .Include(e => e.Organizer)
                .Where(e => e.OrganizerId == organizerId)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Entities.Event>> GetRecommendedAsync(int userId)
        {
            var userSkillIds = await _context.VolunteerSkills
                .Where(vs => vs.UserId == userId)
                .Select(vs => vs.SkillId)
                .ToListAsync();

            var events = await _context.Events
                .Include(e => e.Category)
                .Include(e => e.Organizer)
                .Where(e => e.Status == "Approved" &&
                            e.RequiredSkillIds != null && e.RequiredSkillIds != "[]" && e.RequiredSkillIds != "")
                .OrderByDescending(e => e.StartDate)
                .Take(50)
                .ToListAsync();

            // In-memory filter: match any skill
            var matched = events
                .Where(e => {
                    try {
                        var ids = System.Text.Json.JsonSerializer.Deserialize<List<int>>(e.RequiredSkillIds!);
                        return ids != null && ids.Any(id => userSkillIds.Contains(id));
                    } catch { return false; }
                })
                .Take(9)
                .ToList();

            return matched;
        }

        public async Task<Entities.Event?> GetByIdAsync(int id)
        {
            return await _context.Events
                .Include(e => e.Category)
                .Include(e => e.Organizer)
                .Include(e => e.WorkShifts)
                .Include(e => e.Channel)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<Entities.Event> CreateAsync(Entities.Event ev)
        {
            ev.Status = "Pending";
            ev.CreatedAt = DateTime.UtcNow;
            _context.Events.Add(ev);
            await _context.SaveChangesAsync();
            return ev;
        }

        public async Task UpdateAsync(Entities.Event ev)
        {
            _context.Events.Update(ev);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var ev = await _context.Events.FindAsync(id);
            if (ev != null) { _context.Events.Remove(ev); await _context.SaveChangesAsync(); }
        }

        public async Task<Entities.Event> ApproveAsync(int eventId)
        {
            var ev = await _context.Events.FindAsync(eventId)
                ?? throw new Exception("Event not found");

            ev.Status = "Approved";
            ev.QrCode = $"EVT-{DateTime.UtcNow.Year}-{eventId:D4}";

            // Auto-create channel
            var exists = await _context.Channels.AnyAsync(c => c.EventId == eventId);
            if (!exists)
            {
                _context.Channels.Add(new Channel
                {
                    EventId = eventId,
                    Name = $"Kênh trao đổi - {ev.Title}",
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                });
            }

            await _context.SaveChangesAsync();

            // Notify organizer
            await _notificationService.SendAsync(ev.OrganizerId,
                "Sự kiện được duyệt", $"Sự kiện '{ev.Title}' đã được phê duyệt.",
                "EventApproved", eventId);

            return ev;
        }

        public async Task<Entities.Event> RejectAsync(int eventId)
        {
            var ev = await _context.Events.FindAsync(eventId)
                ?? throw new Exception("Event not found");
            ev.Status = "Rejected";
            await _context.SaveChangesAsync();
            await _notificationService.SendAsync(ev.OrganizerId,
                "Sự kiện bị từ chối", $"Sự kiện '{ev.Title}' đã bị từ chối.",
                "EventApproved", eventId);
            return ev;
        }

        public async Task<Entities.Event> CompleteAsync(int eventId, int? organizerId = null)
        {
            var ev = await _context.Events.FindAsync(eventId)
                ?? throw new Exception("Event not found");
            if (organizerId.HasValue && ev.OrganizerId != organizerId.Value) throw new Exception("Not authorized");

            ev.Status = "Completed";
            await _context.SaveChangesAsync();

            // Auto-issue certificates
            await _certificateService.IssueCertificatesForEventAsync(eventId);

            return ev;
        }
    }
}
