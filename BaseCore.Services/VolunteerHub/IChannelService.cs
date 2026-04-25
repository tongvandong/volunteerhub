using BaseCore.Entities;

namespace BaseCore.Services.VolunteerHub
{
    public interface IChannelService
    {
        Task<List<Channel>> GetAllAsync();
        Task<Channel?> GetByIdAsync(int channelId);
        Task<(List<Post> Items, int TotalCount)> GetPostsAsync(int channelId, int page, int pageSize);
        Task<Post> CreatePostAsync(int channelId, int authorId, string content, string? imageUrl);
        Task UpdatePostAsync(int postId, int authorId, string content, string? imageUrl);
        Task DeletePostAsync(int postId, int userId, bool isAdmin);
        Task<bool> ToggleLikeAsync(int postId, int userId);
        Task<List<Comment>> GetCommentsAsync(int postId);
        Task<Comment> AddCommentAsync(int postId, int authorId, string content);
        Task DeleteCommentAsync(int commentId, int userId, bool isAdmin);
        Task<bool> CanAccessChannelAsync(int channelId, int userId);
    }
}
