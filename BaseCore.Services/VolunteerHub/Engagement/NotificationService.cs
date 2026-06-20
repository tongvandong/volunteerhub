using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.Services.VolunteerHub
{
    public class NotificationService : INotificationService
    {
        private readonly MySqlDbContext _context;

        public NotificationService(MySqlDbContext context)
        {
            _context = context;
        }

        public async Task SendAsync(int userId, string title, string message, string type, int? relatedId = null)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                RelatedId = relatedId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Gửi push (best-effort, fire-and-forget) tới các thiết bị của user.
            var tokens = await _context.PushDeviceTokens
                .Where(t => t.UserId == userId)
                .Select(t => t.Token)
                .ToListAsync();
            if (tokens.Count > 0)
            {
                _ = ExpoPush.SendAsync(tokens, title, message, new { type, relatedId });
            }
        }

        public async Task RegisterDeviceTokenAsync(int userId, string token, string platform)
        {
            if (string.IsNullOrWhiteSpace(token)) return;
            var existing = await _context.PushDeviceTokens.FirstOrDefaultAsync(t => t.Token == token);
            if (existing == null)
            {
                _context.PushDeviceTokens.Add(new PushDeviceToken { UserId = userId, Token = token, Platform = platform ?? "", UpdatedAt = DateTime.UtcNow });
            }
            else
            {
                existing.UserId = userId; // token có thể đổi chủ khi đăng nhập tài khoản khác
                existing.Platform = platform ?? existing.Platform;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
        }

        public async Task RemoveDeviceTokenAsync(int userId, string token)
        {
            var rows = await _context.PushDeviceTokens.Where(t => t.Token == token).ToListAsync();
            if (rows.Count > 0) { _context.PushDeviceTokens.RemoveRange(rows); await _context.SaveChangesAsync(); }
        }

        public async Task<(List<Notification> Items, int TotalCount)> GetByUserAsync(int userId, int page, int pageSize)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt);

            var totalCount = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return (items, totalCount);
        }

        public async Task MarkReadAsync(int notificationId, int userId)
        {
            var n = await _context.Notifications
                .FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId);
            if (n != null) { n.IsRead = true; await _context.SaveChangesAsync(); }
        }

        public async Task MarkAllReadAsync(int userId)
        {
            var items = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
            items.ForEach(n => n.IsRead = true);
            await _context.SaveChangesAsync();
        }
    }
}
