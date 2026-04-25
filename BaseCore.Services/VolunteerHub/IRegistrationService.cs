using BaseCore.Entities;

namespace BaseCore.Services.VolunteerHub
{
    public interface IRegistrationService
    {
        Task<Registration> RegisterAsync(int eventId, int userId, int? shiftId, string? note);
        Task WithdrawAsync(int eventId, int userId);
        Task<Registration> ConfirmAsync(int registrationId, int organizerId);
        Task<Registration> CancelAsync(int registrationId, int organizerId);
        Task<Registration> CheckInAsync(int registrationId, int organizerId, string qrCode);
        Task<List<Registration>> GetByEventAsync(int eventId);
        Task<List<Registration>> GetByUserAsync(int userId);
        Task<Registration?> GetByEventAndUserAsync(int eventId, int userId);
    }
}
