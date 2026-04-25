using BaseCore.Entities;

namespace BaseCore.Services.VolunteerHub
{
    public interface IEventService
    {
        Task<(List<Entities.Event> Items, int TotalCount)> SearchAsync(
            string? keyword, int? categoryId, string? status,
            DateTime? startDateFrom, int page, int pageSize, int? skillId = null, string? location = null);
        Task<List<Entities.Event>> GetByOrganizerAsync(int organizerId);
        Task<List<Entities.Event>> GetRecommendedAsync(int userId);
        Task<Entities.Event?> GetByIdAsync(int id);
        Task<Entities.Event> CreateAsync(Entities.Event ev);
        Task UpdateAsync(Entities.Event ev);
        Task DeleteAsync(int id);
        Task<Entities.Event> ApproveAsync(int eventId); // Admin: Approved + create Channel
        Task<Entities.Event> RejectAsync(int eventId);  // Admin: Rejected
        Task<Entities.Event> CompleteAsync(int eventId, int? organizerId = null); // Organizer/Admin: Completed + issue certs
    }
}
