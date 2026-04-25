using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.Services.VolunteerHub
{
    public class BadgeService : IBadgeService
    {
        private readonly MySqlDbContext _context;
        private readonly INotificationService _notificationService;

        public BadgeService(MySqlDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task CheckAndAwardAsync(int userId)
        {
            var profile = await _context.VolunteerProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
            var totalHours = profile?.TotalVolunteerHours ?? 0;
            var totalEvents = await _context.Registrations
                .CountAsync(r => r.UserId == userId && r.IsAttended);

            var allBadges = await _context.Badges.ToListAsync();
            var ownedBadgeIds = await _context.UserBadges
                .Where(ub => ub.UserId == userId).Select(ub => ub.BadgeId).ToListAsync();

            foreach (var badge in allBadges)
            {
                if (ownedBadgeIds.Contains(badge.Id)) continue;
                if (MeetsCondition(badge.Condition, totalEvents, totalHours))
                {
                    _context.UserBadges.Add(new UserBadge
                    {
                        UserId = userId,
                        BadgeId = badge.Id,
                        AwardedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();

                    await _notificationService.SendAsync(userId,
                        "Huy hiệu mới!", $"Bạn đã nhận được huy hiệu '{badge.Name}'.",
                        "BadgeAwarded", badge.Id);
                }
            }
        }

        private bool MeetsCondition(string condition, int totalEvents, decimal totalHours)
        {
            if (string.IsNullOrEmpty(condition)) return false;
            try
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, decimal>>(condition);
                if (dict == null) return false;
                if (dict.TryGetValue("min_events", out var minEvents) && totalEvents < (int)minEvents) return false;
                if (dict.TryGetValue("min_hours", out var minHours) && totalHours < minHours) return false;
                return true;
            }
            catch { return false; }
        }

        public async Task<List<Badge>> GetAllAsync()
        {
            return await _context.Badges.ToListAsync();
        }

        public async Task<List<UserBadge>> GetByUserAsync(int userId)
        {
            return await _context.UserBadges
                .Include(ub => ub.Badge)
                .Where(ub => ub.UserId == userId)
                .OrderByDescending(ub => ub.AwardedAt)
                .ToListAsync();
        }
    }
}
