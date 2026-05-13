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
            if (ev.RequiresKyc)
            {
                var kycStatus = await _context.VolunteerProfiles
                    .Where(p => p.UserId == userId)
                    .Select(p => p.KycStatus)
                    .FirstOrDefaultAsync();
                if (kycStatus != "Verified")
                    throw new Exception("This event requires verified volunteer identity (KYC). Please verify your profile before registering.");
            }

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

        public async Task<Registration> RequestCancelAsync(int eventId, int userId, string? reason)
        {
            var reg = await _context.Registrations
                .Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId)
                ?? throw new Exception("Registration not found");
            if (reg.Status != "Confirmed") throw new Exception("Only confirmed registrations can request cancellation");
            if (reg.IsAttended) throw new Exception("Cannot request cancellation after check-in");
            if (reg.Event.Status == "Completed" || reg.Event.Status == "Cancelled") throw new Exception("Event is no longer active");

            reg.CancelRequested = true;
            reg.CancelRequestedAt = DateTime.UtcNow;
            reg.CancelReason = reason?.Trim() ?? "";
            await _context.SaveChangesAsync();

            var volunteer = await _context.Users.FindAsync(userId);
            await _notificationService.SendAsync(reg.Event.OrganizerId,
                "Yêu cầu hủy đăng ký",
                $"{volunteer?.Name} xin hủy tham gia '{reg.Event.Title}'.",
                "RegistrationCancelRequested", eventId);

            return reg;
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

            var wasCancelRequest = reg.CancelRequested;
            reg.Status = "Cancelled";
            reg.CancelRequested = false;
            var ev = await _context.Events.FindAsync(reg.EventId);
            if (ev != null && ev.CurrentParticipants > 0) ev.CurrentParticipants--;
            await _context.SaveChangesAsync();

            if (wasCancelRequest)
            {
                await _notificationService.SendAsync(reg.UserId,
                    "Đăng ký đã được hủy",
                    $"Ban tổ chức đã xác nhận hủy đăng ký của bạn cho sự kiện '{reg.Event.Title}'.",
                    "RegistrationCancelled", reg.EventId);
            }

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

        public async Task<Registration> SelfCheckInAsync(int eventId, int userId, string? qrCode, decimal? latitude = null, decimal? longitude = null)
        {
            var reg = await _context.Registrations.Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == userId)
                ?? throw new Exception("Registration not found");

            if (reg.Event.Status != "Approved") throw new Exception("Event is not open for check-in");
            if (reg.Status != "Confirmed") throw new Exception("Registration is not confirmed");
            if (reg.IsAttended) throw new Exception("Already checked in");

            var qrValid = !string.IsNullOrWhiteSpace(qrCode) && reg.Event.QrCode == qrCode.Trim();
            var gpsValid = IsWithinEventRadius(reg.Event, latitude, longitude);
            if (!qrValid && !gpsValid) throw new Exception("Invalid QR code or GPS location");

            reg.IsAttended = true;
            reg.AttendedAt = DateTime.UtcNow;

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

        public async Task<Registration> WalkInAsync(int eventId, int volunteerUserId, int organizerId, string? note)
        {
            var ev = await _context.Events.FindAsync(eventId)
                ?? throw new Exception("Event not found");
            if (ev.OrganizerId != organizerId) throw new Exception("Not authorized");
            if (ev.Status != "Approved") throw new Exception("Event is not open for walk-in check-in");

            var volunteer = await _context.Users.FindAsync(volunteerUserId)
                ?? throw new Exception("Volunteer account not found");
            if (!volunteer.IsActive) throw new Exception("Volunteer account is not active");
            if (volunteer.UserType != 0) throw new Exception("Target user is not a volunteer");

            var existing = await _context.Registrations
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.UserId == volunteerUserId);
            var attendedAt = DateTime.UtcNow;
            var hours = ev.EndDate > ev.StartDate ? (decimal)(ev.EndDate - ev.StartDate).TotalHours : 0m;

            if (existing != null)
            {
                if (existing.IsAttended) return existing;
                if (existing.Status == "Cancelled")
                {
                    // Re-activate cancelled registration for walk-in
                    if (ev.CurrentParticipants < ev.MaxParticipants) ev.CurrentParticipants++;
                }
                existing.Status = "Confirmed";
                existing.ConfirmedAt = existing.ConfirmedAt ?? attendedAt;
                existing.IsAttended = true;
                existing.AttendedAt = attendedAt;
                existing.VolunteerHours = hours;
                existing.CancelRequested = false;
                existing.Note = string.IsNullOrWhiteSpace(note) ? existing.Note : note.Trim();
                await _context.SaveChangesAsync();
                return existing;
            }

            var reg = new Registration
            {
                EventId = eventId,
                UserId = volunteerUserId,
                Status = "Confirmed",
                Note = note?.Trim() ?? "Walk-in",
                RegisteredAt = attendedAt,
                ConfirmedAt = attendedAt,
                IsAttended = true,
                AttendedAt = attendedAt,
                VolunteerHours = hours
            };
            _context.Registrations.Add(reg);
            // Walk-in bypasses capacity check to support on-site reality
            ev.CurrentParticipants++;
            await _context.SaveChangesAsync();
            return reg;
        }

        public async Task<Registration> ManualAttendAsync(int eventId, int registrationId, int organizerId, decimal? hoursOverride)
        {
            var reg = await _context.Registrations.Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == registrationId)
                ?? throw new Exception("Registration not found");
            if (reg.EventId != eventId) throw new Exception("Registration not found in this event");
            if (reg.Event.OrganizerId != organizerId) throw new Exception("Not authorized");
            if (reg.Status != "Confirmed") throw new Exception("Registration is not confirmed");
            if (reg.Event.Status != "Approved" && reg.Event.Status != "Completed")
                throw new Exception("Event must be approved or completed to record attendance");

            // Grace window: allow manual attend up to 7 days after EndDate
            if (DateTime.UtcNow > reg.Event.EndDate.AddDays(7))
                throw new Exception("Manual attendance window (7 days after event) has closed");

            if (reg.IsAttended && !hoursOverride.HasValue) return reg;

            reg.IsAttended = true;
            reg.AttendedAt = reg.AttendedAt ?? DateTime.UtcNow;
            var defaultHours = reg.Event.EndDate > reg.Event.StartDate
                ? (decimal)(reg.Event.EndDate - reg.Event.StartDate).TotalHours
                : 0m;
            reg.VolunteerHours = hoursOverride.HasValue && hoursOverride.Value >= 0
                ? hoursOverride.Value
                : (reg.VolunteerHours > 0 ? reg.VolunteerHours : defaultHours);

            await _context.SaveChangesAsync();
            return reg;
        }

        public async Task<Registration> AdjustHoursAsync(int eventId, int registrationId, int organizerId, decimal hours)
        {
            if (hours < 0 || hours > 24 * 60) throw new Exception("Hours must be between 0 and 1440");

            var reg = await _context.Registrations.Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == registrationId)
                ?? throw new Exception("Registration not found");
            if (reg.EventId != eventId) throw new Exception("Registration not found in this event");
            if (reg.Event.OrganizerId != organizerId) throw new Exception("Not authorized");
            if (!reg.IsAttended) throw new Exception("Cannot adjust hours for a volunteer who did not check in");

            reg.VolunteerHours = hours;
            await _context.SaveChangesAsync();
            return reg;
        }

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
