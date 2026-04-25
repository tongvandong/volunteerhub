using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.Services.VolunteerHub
{
    public class ChannelService : IChannelService
    {
        private readonly MySqlDbContext _context;

        public ChannelService(MySqlDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CanAccessChannelAsync(int channelId, int userId)
        {
            var channel = await _context.Channels.Include(c => c.Event).FirstOrDefaultAsync(c => c.Id == channelId);
            if (channel == null) return false;

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            // Admin always has access
            if (user.UserType == 3) return true;
            // Organizer of the event
            if (channel.Event.OrganizerId == userId) return true;
            // Confirmed volunteer
            return await _context.Registrations.AnyAsync(r =>
                r.EventId == channel.EventId && r.UserId == userId && r.Status == "Confirmed");
        }

        public async Task<List<Channel>> GetAllAsync()
        {
            return await _context.Channels.Include(c => c.Event).Where(c => c.IsActive).ToListAsync();
        }

        public async Task<Channel?> GetByIdAsync(int channelId)
        {
            return await _context.Channels.Include(c => c.Event).FirstOrDefaultAsync(c => c.Id == channelId);
        }

        public async Task<(List<Post> Items, int TotalCount)> GetPostsAsync(int channelId, int page, int pageSize)
        {
            var query = _context.Posts
                .Include(p => p.Author)
                .Where(p => p.ChannelId == channelId)
                .OrderByDescending(p => p.CreatedAt);

            var totalCount = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return (items, totalCount);
        }

        public async Task<Post> CreatePostAsync(int channelId, int authorId, string content, string? imageUrl)
        {
            var post = new Post
            {
                ChannelId = channelId, AuthorId = authorId,
                Content = content, ImageUrl = imageUrl ?? "",
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
            };
            _context.Posts.Add(post);
            await _context.SaveChangesAsync();
            return post;
        }

        public async Task UpdatePostAsync(int postId, int authorId, string content, string? imageUrl)
        {
            var post = await _context.Posts.FindAsync(postId)
                ?? throw new Exception("Post not found");
            if (post.AuthorId != authorId) throw new Exception("Not authorized");
            post.Content = content;
            if (imageUrl != null) post.ImageUrl = imageUrl;
            post.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task DeletePostAsync(int postId, int userId, bool isAdmin)
        {
            var post = await _context.Posts.FindAsync(postId) ?? throw new Exception("Post not found");
            if (!isAdmin && post.AuthorId != userId) throw new Exception("Not authorized");
            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ToggleLikeAsync(int postId, int userId)
        {
            var existing = await _context.Likes.FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);
            var post = await _context.Posts.FindAsync(postId) ?? throw new Exception("Post not found");

            if (existing != null)
            {
                _context.Likes.Remove(existing);
                post.LikeCount = Math.Max(0, post.LikeCount - 1);
                await _context.SaveChangesAsync();
                return false; // unliked
            }

            _context.Likes.Add(new Like { PostId = postId, UserId = userId, CreatedAt = DateTime.UtcNow });
            post.LikeCount++;
            await _context.SaveChangesAsync();
            return true; // liked
        }

        public async Task<List<Comment>> GetCommentsAsync(int postId)
        {
            return await _context.Comments
                .Include(c => c.Author)
                .Where(c => c.PostId == postId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Comment> AddCommentAsync(int postId, int authorId, string content)
        {
            var comment = new Comment { PostId = postId, AuthorId = authorId, Content = content, CreatedAt = DateTime.UtcNow };
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            return comment;
        }

        public async Task DeleteCommentAsync(int commentId, int userId, bool isAdmin)
        {
            var comment = await _context.Comments.FindAsync(commentId) ?? throw new Exception("Comment not found");
            if (!isAdmin && comment.AuthorId != userId) throw new Exception("Not authorized");
            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
        }
    }
}
