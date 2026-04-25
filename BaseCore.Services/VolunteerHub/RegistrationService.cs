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

            var exists = await _context.Registrations.AnyAsync(r => r.EventId == eventId && r.UserId == userId);
            if (exists) throw new Exception("Already registered");

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

        public async Task<Registration> ConfirmAsync(int registrationId, int organizerId)
        {
            var reg = await _context.Registrations.Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == registrationId)
                ?? throw new Exception("Registration not found");
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

        public async Task<Registration> CancelAsync(int registrationId, int organizerId)
        {
            var reg = await _context.Registrations.Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == registrationId)
                ?? throw new Exception("Registration not found");
            if (reg.Event.OrganizerId != organizerId) throw new Exception("Not authorized");

            reg.Status = "Cancelled";
            var ev = await _context.Events.FindAsync(reg.EventId);
            if (ev != null && ev.CurrentParticipants > 0) ev.CurrentParticipants--;
            await _context.SaveChangesAsync();

            return reg;
        }

        public async Task<Registration> CheckInAsync(int registrationId, int organizerId, string qrCode)
        {
            var reg = await _context.Registrations.Include(r => r.Event)
                .FirstOrDefaultAsync(r => r.Id == registrationId)
                ?? throw new Exception("Registration not found");
            if (reg.Event.OrganizerId != organizerId) throw new Exception("Not authorized");
            if (reg.Event.QrCode != qrCode) throw new Exception("Invalid QR code");
            if (reg.Status != "Confirmed") throw new Exception("Registration is not confirmed");

            reg.IsAttended = true;
            reg.AttendedAt = DateTime.UtcNow;

            // Calculate volunteer hours
            if (reg.Event.EndDate > reg.Event.StartDate)
                reg.VolunteerHours = (decimal)(reg.Event.EndDate - reg.Event.StartDate).TotalHours;

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
