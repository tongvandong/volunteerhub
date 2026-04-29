using BaseCore.Entities;

namespace BaseCore.Services.VolunteerHub
{
    public interface IRegistrationService
    {
        Task<Registration> RegisterAsync(int eventId, int userId, int? shiftId, string? note);
        Task WithdrawAsync(int eventId, int userId);
        Task<Registration> ConfirmAsync(int eventId, int registrationId, int organizerId);
        Task<Registration> CancelAsync(int eventId, int registrationId, int organizerId);
        Task<Registration> CheckInAsync(int eventId, int registrationId, int organizerId, string? qrCode, decimal? latitude = null, decimal? longitude = null);
        Task<List<Registration>> GetByEventAsync(int eventId);
        Task<List<Registration>> GetByUserAsync(int userId);
        Task<Registration?> GetByEventAndUserAsync(int eventId, int userId);
    }
}
