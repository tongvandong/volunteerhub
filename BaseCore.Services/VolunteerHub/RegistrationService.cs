using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.Services.VolunteerHub
{
    public class RegistrationService : IRegistrationService
    {
        private readonly MySqlDbContext _context;
        private readonly INotificationService _notificationService;

        public RegistrationService(MySqlDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<Registration> RegisterAsync(int eventId, int userId, int? shiftId, string? note)
        {
            var ev = await _context.Events.FindAsync(eventId)
                ?? throw new Exception("Event not found");
            if (ev.Status != "Approved") throw new Exception("Event is not open for registration");
            if (ev.CurrentParticipants >= ev.MaxParticipants) throw new Exception("Event is full");

            if (shiftId.HasValue)
            {
                var shift = await _context.WorkShifts.FindAsync(shiftId.Value)
                    ?? throw new Exception("Shift not found");
                if (shift.EventId != eventId) throw new Exception("Shift does not belong to this event");

                var shiftRegistrations = await _context.Registrations.CountAsync(r =>
                    r.ShiftId == shiftId.Value && r.Status != "Cancelled");
                if (shiftRegistrations >= shift.MaxVolunteers) throw new Exception("Shift is full");
            }

            var existing = await _context.Registrations
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId);
            if (existing != null)
            {
                if (existing.Status != "Cancelled") throw new Exception("Already registered");

                existing.ShiftId = shiftId;
                existing.Status = "Pending";
                existing.Note = note ?? "";
                existing.RegisteredAt = DateTime.UtcNow;
                existing.ConfirmedAt = null;
                existing.IsAttended = false;
                existing.AttendedAt = null;
                existing.VolunteerHours = 0;
                ev.CurrentParticipants++;
                await _context.SaveChangesAsync();

                var existingVolunteer = await _context.Users.FindAsync(userId);
                await _notificationService.SendAsync(ev.OrganizerId,
                    "ÄÄƒng kÃ½ má»›i", $"{existingVolunteer?.Name} Ä‘Ã£ Ä‘Äƒng kÃ½ sá»± kiá»‡n '{ev.Title}'.",
                    "RegistrationConfirmed", eventId);

                return existing;
            }

            var reg = new Registration
            {
                EventId = eventId,
                UserId = userId,
                ShiftId = shiftId,
                Status = "Pending",
                Note = note ?? "",
                RegisteredAt = DateTime.UtcNow
            };
            _context.Registrations.Add(reg);
            ev.CurrentParticipants++;
            await _context.SaveChangesAsync();

            // Notify organizer
            var volunteer = await _context.Users.FindAsync(userId);
            await _notificationService.SendAsync(ev.OrganizerId,
                "Đăng ký mới", $"{volunteer?.Name} đã đăng ký sự kiện '{ev.Title}'.",
                "RegistrationConfirmed", eventId);

            return reg;
        }

        public async Task WithdrawAsync(int eventId, int userId)
        {
            var reg = await _context.Registrations
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId)
                ?? throw new Exception("Registration not found");
            if (reg.Status == "Confirmed") throw new Exception("Cannot withdraw a confirmed registration");

            var ev = await _context.Events.FindAsync(eventId);
            if (ev != null && ev.CurrentParticipants > 0) ev.CurrentParticipants--;

            _context.Registrations.Remove(reg);
            await _context.SaveChangesAsync();
        }

        public async Task<Registration> ConfirmAsync(int eventId, int registrationId, int organizerId)
        {
            var reg = await _context.Registrations.Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == registrationId)
                ?? throw new Exception("Registration not found");
            if (reg.EventId != eventId) throw new Exception("Registration not found in this event");
            if (reg.Event.OrganizerId != organizerId) throw new Exception("Not authorized");

            reg.Status = "Confirmed";
            reg.ConfirmedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _notificationService.SendAsync(reg.UserId,
                "Đăng ký được xác nhận",
                $"Đơn đăng ký của bạn cho sự kiện '{reg.Event.Title}' đã được xác nhận.",
                "RegistrationConfirmed", reg.EventId);

            return reg;
        }

        public async Task<Registration> CancelAsync(int eventId, int registrationId, int organizerId)
        {
            var reg = await _context.Registrations.Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == registrationId)
                ?? throw new Exception("Registration not found");
            if (reg.EventId != eventId) throw new Exception("Registration not found in this event");
            if (reg.Event.OrganizerId != organizerId) throw new Exception("Not authorized");

            reg.Status = "Cancelled";
            var ev = await _context.Events.FindAsync(reg.EventId);
            if (ev != null && ev.CurrentParticipants > 0) ev.CurrentParticipants--;
            await _context.SaveChangesAsync();

            return reg;
        }

        public async Task<Registration> CheckInAsync(int eventId, int registrationId, int organizerId, string? qrCode, decimal? latitude = null, decimal? longitude = null)
        {
            var reg = await _context.Registrations.Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == registrationId)
                ?? throw new Exception("Registration not found");
            if (reg.EventId != eventId) throw new Exception("Registration not found in this event");
            if (reg.Event.OrganizerId != organizerId) throw new Exception("Not authorized");
            if (reg.Status != "Confirmed") throw new Exception("Registration is not confirmed");

            var qrValid = !string.IsNullOrWhiteSpace(qrCode) && reg.Event.QrCode == qrCode.Trim();
            var gpsValid = IsWithinEventRadius(reg.Event, latitude, longitude);
            if (!qrValid && !gpsValid) throw new Exception("Invalid QR code or GPS location");

            reg.IsAttended = true;
            reg.AttendedAt = DateTime.UtcNow;

            // Calculate volunteer hours
            if (reg.Event.EndDate > reg.Event.StartDate)
                reg.VolunteerHours = (decimal)(reg.Event.EndDate - reg.Event.StartDate).TotalHours;

            await _context.SaveChangesAsync();
            return reg;
        }

        private static bool IsWithinEventRadius(Entities.Event ev, decimal? latitude, decimal? longitude)
        {
            if (!latitude.HasValue || !longitude.HasValue || !ev.Latitude.HasValue || !ev.Longitude.HasValue)
                return false;

            var distanceKm = HaversineKm(
                (double)latitude.Value,
                (double)longitude.Value,
                (double)ev.Latitude.Value,
                (double)ev.Longitude.Value);

            return distanceKm <= 0.5;
        }

        private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
        {
            const double radiusKm = 6371;
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return radiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }

        private static double ToRadians(double degrees) => degrees * Math.PI / 180;

        public async Task<List<Registration>> GetByEventAsync(int eventId)
        {
            return await _context.Registrations
                .Include(r => r.User)
                .Include(r => r.Shift)
                .Where(r => r.EventId == eventId)
                .OrderByDescending(r => r.RegisteredAt)
                .ToListAsync();
        }

        public async Task<List<Registration>> GetByUserAsync(int userId)
        {
            return await _context.Registrations
                .Include(r => r.Event).ThenInclude(e => e.Category)
                .Include(r => r.Event).ThenInclude(e => e.Organizer)
                .Include(r => r.Shift)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.RegisteredAt)
                .ToListAsync();
        }

        public async Task<Registration?> GetByEventAndUserAsync(int eventId, int userId)
        {
            return await _context.Registrations
                .Include(r => r.Event)
                .Include(r => r.Shift)
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId);
        }
    }
}
