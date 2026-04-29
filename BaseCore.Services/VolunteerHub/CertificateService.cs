using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using System.Text;

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
                    PdfUrl = $"/api/certificates/{code}/pdf"
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

        public byte[] BuildCertificatePdf(Certificate cert, string verifyUrl)
        {
            var title = EscapePdf("VOLUNTEERHUB CERTIFICATE");
            var subtitle = EscapePdf("Certificate of Volunteer Contribution");
            var volunteer = EscapePdf(cert.User?.Name ?? cert.User?.UserName ?? $"User #{cert.UserId}");
            var ev = EscapePdf(cert.Event?.Title ?? $"Event #{cert.EventId}");
            var code = EscapePdf(cert.CertificateCode);
            var issued = EscapePdf(cert.IssuedAt.ToString("yyyy-MM-dd"));
            var hours = EscapePdf($"{cert.VolunteerHours:0.##} volunteer hours");
            var verify = EscapePdf(verifyUrl);

            var stream = new MemoryStream();
            var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true);
            var offsets = new List<long>();

            void Write(string value) => writer.Write(value);
            void Obj(int id, string body)
            {
                writer.Flush();
                offsets.Add(stream.Position);
                Write($"{id} 0 obj\n{body}\nendobj\n");
            }

            Write("%PDF-1.4\n");
            Obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
            Obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
            Obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>");
            Obj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
            Obj(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

            var content = string.Join("\n", new[]
            {
                "q",
                "2 w 42 42 758 511 re S",
                "BT /F2 30 Tf 230 500 Td (" + title + ") Tj ET",
                "BT /F1 16 Tf 292 470 Td (" + subtitle + ") Tj ET",
                "BT /F1 14 Tf 110 405 Td (This certifies that) Tj ET",
                "BT /F2 28 Tf 110 365 Td (" + volunteer + ") Tj ET",
                "BT /F1 14 Tf 110 325 Td (has completed volunteer service for) Tj ET",
                "BT /F2 20 Tf 110 292 Td (" + ev + ") Tj ET",
                "BT /F1 14 Tf 110 252 Td (Recognized contribution: " + hours + ") Tj ET",
                "BT /F1 12 Tf 110 210 Td (Issued: " + issued + ") Tj ET",
                "BT /F1 12 Tf 110 188 Td (Certificate code / QR identifier: " + code + ") Tj ET",
                "BT /F1 10 Tf 110 166 Td (Verify: " + verify + ") Tj ET",
                "BT /F2 12 Tf 610 100 Td (VolunteerHub) Tj ET",
                "Q"
            });
            var contentBytes = Encoding.ASCII.GetBytes(content);
            Obj(6, $"<< /Length {contentBytes.Length} >>\nstream\n{content}\nendstream");

            writer.Flush();
            var xrefPosition = stream.Position;
            Write($"xref\n0 {offsets.Count + 1}\n0000000000 65535 f \n");
            foreach (var offset in offsets)
                Write($"{offset:0000000000} 00000 n \n");
            Write($"trailer\n<< /Size {offsets.Count + 1} /Root 1 0 R >>\nstartxref\n{xrefPosition}\n%%EOF");
            writer.Flush();

            return stream.ToArray();
        }

        private static string EscapePdf(string value)
        {
            return value
                .Replace("\\", "\\\\")
                .Replace("(", "\\(")
                .Replace(")", "\\)");
        }
    }
}
