using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.Services.VolunteerHub
{
    public class CertificateService : ICertificateService
    {
        private readonly MySqlDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IBadgeService _badgeService;

        public CertificateService(MySqlDbContext context, INotificationService notificationService, IBadgeService badgeService)
        {
            _context = context;
            _notificationService = notificationService;
            _badgeService = badgeService;
        }

        public async Task IssueCertificatesForEventAsync(int eventId)
        {
            var ev = await _context.Events.FindAsync(eventId);
            if (ev == null) return;

            // Get all attended registrations
            var attended = await _context.Registrations
                .Where(r => r.EventId == eventId && r.IsAttended)
                .ToListAsync();

            foreach (var reg in attended)
            {
                // Skip if already issued
                var already = await _context.Certificates
                    .AnyAsync(c => c.UserId == reg.UserId && c.EventId == eventId);
                if (already) continue;

                var code = $"CERT-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
                var cert = new Certificate
                {
                    UserId = reg.UserId,
                    EventId = eventId,
                    CertificateCode = code,
                    IssuedAt = DateTime.UtcNow,
                    VolunteerHours = reg.VolunteerHours,
                    PdfUrl = ""
                };
                _context.Certificates.Add(cert);

                // Update total volunteer hours in profile
                var profile = await _context.VolunteerProfiles.FirstOrDefaultAsync(p => p.UserId == reg.UserId);
                if (profile != null)
                    profile.TotalVolunteerHours += reg.VolunteerHours;

                await _context.SaveChangesAsync();

                // Notify volunteer
                await _notificationService.SendAsync(reg.UserId,
                    "Chứng chỉ được cấp",
                    $"Bạn đã nhận được chứng chỉ tình nguyện cho sự kiện '{ev.Title}'.",
                    "CertificateIssued", cert.Id);

                // Check & award badges
                await _badgeService.CheckAndAwardAsync(reg.UserId);
            }
        }

        public async Task<List<Certificate>> GetByUserAsync(int userId)
        {
            return await _context.Certificates
                .Include(c => c.Event).ThenInclude(e => e.Category)
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.IssuedAt)
                .ToListAsync();
        }

        public async Task<Certificate?> GetByCodeAsync(string code)
        {
            return await _context.Certificates
                .Include(c => c.User)
                .Include(c => c.Event)
                .FirstOrDefaultAsync(c => c.CertificateCode == code);
        }
    }
}
