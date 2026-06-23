using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.Services.VolunteerHub
{
    public class ChannelService : IChannelService
    {
        private static readonly string[] ValidPostTypes = { "announcement", "discussion", "question" };
        private readonly MySqlDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IChannelRealtimeNotifier _realtimeNotifier;

        public ChannelService(
            MySqlDbContext context,
            INotificationService notificationService,
            IChannelRealtimeNotifier realtimeNotifier)
        {
            _context = context;
            _notificationService = notificationService;
            _realtimeNotifier = realtimeNotifier;
        }

        public async Task<bool> CanAccessChannelAsync(int channelId, int userId)
        {
            var channel = await _context.Channels.Include(c => c.Event).FirstOrDefaultAsync(c => c.Id == channelId);
            if (channel == null) return false;

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            if (user.UserType == 3) return true;
            if (channel.Event.OrganizerId == userId) return true;

            var baseQuery = _context.Registrations.Where(r =>
                r.EventId == channel.EventId &&
                r.UserId == userId &&
                r.Status == "Confirmed");

            if (channel.ShiftId.HasValue)
                return await baseQuery.AnyAsync(r => r.ShiftId == channel.ShiftId.Value);

            return await baseQuery.AnyAsync();
        }

        public async Task<List<Channel>> GetAllAsync()
        {
            return await _context.Channels
                .Include(c => c.Event)
                .Include(c => c.Shift)
                .Where(c => c.IsActive)
                .ToListAsync();
        }

        public async Task<Channel?> GetByIdAsync(int channelId, int? viewerId = null)
        {
            var channel = await _context.Channels
                .Include(c => c.Event)
                .Include(c => c.Shift)
                .Include(c => c.ParentChannel)
                .Include(c => c.SubChannels).ThenInclude(sc => sc.Shift)
                .FirstOrDefaultAsync(c => c.Id == channelId);
            if (channel == null) return null;

            var parentId = channel.ParentChannelId ?? channel.Id;
            var siblings = await _context.Channels
                .Include(c => c.Shift)
                .Where(c => c.ParentChannelId == parentId && c.IsActive)
                .OrderBy(c => c.ShiftId.HasValue)
                .ThenBy(c => c.CreatedAt)
                .ToListAsync();

            if (viewerId.HasValue)
            {
                var allowed = new List<Channel>();
                foreach (var sub in siblings)
                    if (await CanAccessChannelAsync(sub.Id, viewerId.Value)) allowed.Add(sub);
                siblings = allowed;
            }

            channel.SubChannels = siblings;
            return channel;
        }

        public async Task<(List<Post> Items, int TotalCount)> GetPostsAsync(
            int channelId,
            int page,
            int pageSize,
            int userId,
            string? postType = null)
        {
            var query = _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Comments)
                .Include(p => p.Likes)
                .Include(p => p.Poll).ThenInclude(p => p.Options)
                .Include(p => p.Poll).ThenInclude(p => p.Votes)
                .Where(p => p.ChannelId == channelId);

            if (!string.IsNullOrWhiteSpace(postType) && postType != "all")
                query = query.Where(p => p.PostType == postType);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(p => p.IsPinned)
                .ThenByDescending(p => p.PinnedAt)
                .ThenByDescending(p => p.CreatedAt)
                .Skip((Math.Max(page, 1) - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            await HydratePostAuthorsAsync(items);

            foreach (var post in items)
            {
                post.CommentCount = post.Comments?.Count ?? 0;
                post.IsLikedByMe = post.Likes?.Any(l => l.UserId == userId) == true;
                if (post.Poll != null)
                {
                    post.Poll.Options = post.Poll.Options.OrderBy(o => o.SortOrder).ToList();
                    post.Poll.UserVotedOptionId = post.Poll.Votes
                        .OrderBy(v => v.CreatedAt)
                        .FirstOrDefault(v => v.UserId == userId)?.OptionId;
                    post.Poll.Votes = new List<PollVote>();
                }
                post.Comments = new List<Comment>();
                post.Likes = new List<Like>();
            }

            return (items, totalCount);
        }

        public async Task<Post> CreatePostAsync(int channelId, int authorId, string content, string? imageUrl, string postType, AttachmentDto? attachment)
        {
            if (!await CanAccessChannelAsync(channelId, authorId)) throw new Exception("Not authorized");

            postType = NormalizePostType(postType);
            var channel = await _context.Channels.Include(c => c.Event).FirstAsync(c => c.Id == channelId);
            var author = await _context.Users.FindAsync(authorId) ?? throw new Exception("User not found");
            if (postType == "announcement" && channel.Event.OrganizerId != authorId && author.UserType != 3)
                throw new Exception("Only organizer or admin can create announcements");

            var post = new Post
            {
                ChannelId = channelId,
                AuthorId = authorId,
                Content = content,
                ImageUrl = imageUrl ?? "",
                PostType = postType,
                AttachmentUrl = attachment?.Url ?? "",
                AttachmentName = attachment?.Name ?? "",
                AttachmentType = attachment?.Type ?? "",
                AttachmentSize = attachment?.Size ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Posts.Add(post);
            await _context.SaveChangesAsync();
            await ProcessMentionsAsync(content, "Post", post.Id, authorId, channelId);

            var created = await LoadPostAsync(post.Id, authorId) ?? post;
            await _realtimeNotifier.PostCreatedAsync(channelId, created);
            return created;
        }

        public async Task UpdatePostAsync(int channelId, int postId, int authorId, string content, string? imageUrl)
        {
            var post = await _context.Posts.FindAsync(postId)
                ?? throw new Exception("Post not found");
            if (post.ChannelId != channelId) throw new Exception("Post not found in this channel");
            if (!await CanAccessChannelAsync(channelId, authorId)) throw new Exception("Not authorized");
            if (post.AuthorId != authorId) throw new Exception("Not authorized");
            post.Content = content;
            if (imageUrl != null) post.ImageUrl = imageUrl;
            post.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await ProcessMentionsAsync(content, "Post", post.Id, authorId, channelId);
        }

        public async Task DeletePostAsync(int channelId, int postId, int userId, bool isAdmin)
        {
            var post = await _context.Posts.FindAsync(postId) ?? throw new Exception("Post not found");
            if (post.ChannelId != channelId) throw new Exception("Post not found in this channel");
            if (!isAdmin && !await CanAccessChannelAsync(channelId, userId)) throw new Exception("Not authorized");
            if (!isAdmin && post.AuthorId != userId) throw new Exception("Not authorized");
            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
        }

        public async Task<Post> TogglePinAsync(int channelId, int postId, int organizerId, bool isAdmin)
        {
            var channel = await _context.Channels.Include(c => c.Event).FirstOrDefaultAsync(c => c.Id == channelId)
                ?? throw new Exception("Channel not found");
            if (!isAdmin && channel.Event.OrganizerId != organizerId)
                throw new Exception("Only organizer or admin can pin posts");

            var post = await _context.Posts.FindAsync(postId) ?? throw new Exception("Post not found");
            if (post.ChannelId != channelId) throw new Exception("Post not in this channel");

            if (!post.IsPinned)
            {
                var pinnedCount = await _context.Posts.CountAsync(p => p.ChannelId == channelId && p.IsPinned);
                if (pinnedCount >= 3) throw new Exception("Maximum 3 pinned posts per channel");
            }

            post.IsPinned = !post.IsPinned;
            post.PinnedAt = post.IsPinned ? DateTime.UtcNow : null;
            await _context.SaveChangesAsync();
            return await LoadPostAsync(post.Id, organizerId) ?? post;
        }

        public async Task<bool> ToggleLikeAsync(int channelId, int postId, int userId)
        {
            var existing = await _context.Likes.FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);
            var post = await _context.Posts.FindAsync(postId) ?? throw new Exception("Post not found");
            if (post.ChannelId != channelId) throw new Exception("Post not found in this channel");
            if (!await CanAccessChannelAsync(channelId, userId)) throw new Exception("Not authorized");

            if (existing != null)
            {
                _context.Likes.Remove(existing);
                post.LikeCount = Math.Max(0, post.LikeCount - 1);
                await _context.SaveChangesAsync();
                return false;
            }

            _context.Likes.Add(new Like { PostId = postId, UserId = userId, CreatedAt = DateTime.UtcNow });
            post.LikeCount++;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Comment>> GetCommentsAsync(int postId)
        {
            var comments = await _context.Comments
                .Include(c => c.Author)
                .Where(c => c.PostId == postId)
                .OrderBy(c => c.ParentCommentId.HasValue)
                .ThenBy(c => c.CreatedAt)
                .ToListAsync();

            await HydrateCommentAuthorsAsync(comments);
            return comments;
        }

        public async Task<Comment> AddCommentAsync(int channelId, int postId, int authorId, string content, int? parentCommentId)
        {
            var post = await _context.Posts.FindAsync(postId) ?? throw new Exception("Post not found");
            if (post.ChannelId != channelId) throw new Exception("Post not found in this channel");
            if (!await CanAccessChannelAsync(channelId, authorId)) throw new Exception("Not authorized");

            if (parentCommentId.HasValue)
            {
                var parent = await _context.Comments.FindAsync(parentCommentId.Value);
                if (parent == null || parent.PostId != postId) throw new Exception("Parent comment invalid");
                if (parent.ParentCommentId.HasValue) throw new Exception("Reply nesting not allowed");
            }

            var comment = new Comment
            {
                PostId = postId,
                AuthorId = authorId,
                Content = content,
                ParentCommentId = parentCommentId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            await ProcessMentionsAsync(content, "Comment", comment.Id, authorId, channelId);

            var created = await _context.Comments.Include(c => c.Author).FirstAsync(c => c.Id == comment.Id);
            await HydrateCommentAuthorsAsync(new[] { created });
            await _realtimeNotifier.CommentAddedAsync(channelId, postId, created);
            return created;
        }

        public async Task DeleteCommentAsync(int channelId, int postId, int commentId, int userId, bool isAdmin)
        {
            var comment = await _context.Comments
                .Include(c => c.Post)
                .FirstOrDefaultAsync(c => c.Id == commentId)
                ?? throw new Exception("Comment not found");
            if (comment.PostId != postId || comment.Post.ChannelId != channelId)
                throw new Exception("Comment not found in this channel");
            if (!isAdmin && !await CanAccessChannelAsync(channelId, userId)) throw new Exception("Not authorized");
            if (!isAdmin && comment.AuthorId != userId) throw new Exception("Not authorized");
            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
        }

        public async Task<List<object>> GetChannelMembersAsync(int channelId, string? query)
        {
            var channel = await _context.Channels.Include(c => c.Event).FirstOrDefaultAsync(c => c.Id == channelId)
                ?? throw new Exception("Channel not found");
            var term = (query ?? "").Trim().ToLowerInvariant();
            var userIds = new HashSet<int> { channel.Event.OrganizerId };

            var registrations = _context.Registrations.Where(r => r.EventId == channel.EventId && r.Status == "Confirmed");
            if (channel.ShiftId.HasValue)
                registrations = registrations.Where(r => r.ShiftId == channel.ShiftId.Value);
            foreach (var id in await registrations.Select(r => r.UserId).ToListAsync())
                userIds.Add(id);

            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .Where(u => term == "" || u.UserName.ToLower().Contains(term) || (u.Name ?? "").ToLower().Contains(term))
                .OrderBy(u => u.UserName)
                .Take(12)
                .Select(u => new { u.Id, u.UserName, u.Name, role = u.UserType })
                .ToListAsync();

            return users.Cast<object>().ToList();
        }

        public async Task<Channel> CreateShiftChannelAsync(int shiftId, int organizerId)
        {
            var shift = await _context.WorkShifts.Include(s => s.Event).FirstOrDefaultAsync(s => s.Id == shiftId)
                ?? throw new Exception("Shift not found");
            if (shift.Event.OrganizerId != organizerId) throw new Exception("Not authorized");

            var existing = await _context.Channels.FirstOrDefaultAsync(c => c.ShiftId == shiftId);
            if (existing != null) return existing;

            var parentChannel = await _context.Channels.FirstOrDefaultAsync(c => c.EventId == shift.EventId && c.ParentChannelId == null);
            if (parentChannel == null)
            {
                // Parent channel not yet created (event not approved yet) — create it now
                parentChannel = new Channel
                {
                    EventId = shift.EventId,
                    Name = shift.Event.Title ?? "Kênh sự kiện",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Channels.Add(parentChannel);
                await _context.SaveChangesAsync();
            }

            var subChannel = new Channel
            {
                EventId = shift.EventId,
                Name = $"{parentChannel.Name} - {shift.Name}",
                ParentChannelId = parentChannel.Id,
                ShiftId = shiftId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Channels.Add(subChannel);
            await _context.SaveChangesAsync();
            return subChannel;
        }

        public async Task<Poll> CreatePollAsync(int channelId, int postId, int organizerId, bool isAdmin, PollCreateDto dto)
        {
            var channel = await _context.Channels.Include(c => c.Event).FirstOrDefaultAsync(c => c.Id == channelId)
                ?? throw new Exception("Channel not found");
            if (!isAdmin && channel.Event.OrganizerId != organizerId)
                throw new Exception("Only organizer or admin can create polls");

            var post = await _context.Posts.FindAsync(postId) ?? throw new Exception("Post not found");
            if (post.ChannelId != channelId) throw new Exception("Post not in this channel");
            if (await _context.Polls.AnyAsync(p => p.PostId == postId)) throw new Exception("Post already has a poll");

            var options = dto.Options.Select(o => o.Trim()).Where(o => o.Length > 0).Distinct().ToList();
            if (string.IsNullOrWhiteSpace(dto.Question) || dto.Question.Trim().Length > 500)
                throw new Exception("Poll question is required and must be at most 500 characters");
            if (options.Count < 2 || options.Count > 5)
                throw new Exception("Poll must have 2-5 options");

            var poll = new Poll
            {
                PostId = postId,
                Question = dto.Question.Trim(),
                AllowMultiple = dto.AllowMultiple,
                ExpiresAt = dto.ExpiresAt,
                CreatedAt = DateTime.UtcNow,
                Options = options.Select((text, index) => new PollOption { Text = text, SortOrder = index }).ToList()
            };
            _context.Polls.Add(poll);
            await _context.SaveChangesAsync();

            var created = await LoadPollAsync(poll.Id, organizerId) ?? poll;
            await _realtimeNotifier.PollUpdatedAsync(channelId, created);
            return created;
        }

        public async Task<Poll> VoteAsync(int channelId, int pollId, int optionId, int userId)
        {
            if (!await CanAccessChannelAsync(channelId, userId)) throw new Exception("Not authorized");

            var poll = await _context.Polls
                .Include(p => p.Post)
                .Include(p => p.Options)
                .FirstOrDefaultAsync(p => p.Id == pollId)
                ?? throw new Exception("Poll not found");
            if (poll.Post.ChannelId != channelId) throw new Exception("Poll not in this channel");
            if (poll.ExpiresAt.HasValue && poll.ExpiresAt.Value < DateTime.UtcNow)
                throw new Exception("Poll has expired");

            var option = poll.Options.FirstOrDefault(o => o.Id == optionId)
                ?? throw new Exception("Option not found");
            var existingForOption = await _context.PollVotes.AnyAsync(v => v.PollId == pollId && v.OptionId == optionId && v.UserId == userId);
            if (existingForOption) throw new Exception("You already voted for this option");

            if (!poll.AllowMultiple)
            {
                var existing = await _context.PollVotes
                    .Include(v => v.Option)
                    .Where(v => v.PollId == pollId && v.UserId == userId)
                    .ToListAsync();
                if (existing.Count > 0) throw new Exception("You already voted in this poll");
            }

            _context.PollVotes.Add(new PollVote { PollId = pollId, OptionId = optionId, UserId = userId, CreatedAt = DateTime.UtcNow });
            option.VoteCount++;
            await _context.SaveChangesAsync();

            var updated = await LoadPollAsync(pollId, userId) ?? poll;
            await _realtimeNotifier.PollUpdatedAsync(channelId, updated);
            return updated;
        }

        public async Task<object> GetPollResultsAsync(int channelId, int pollId, int userId)
        {
            if (!await CanAccessChannelAsync(channelId, userId)) throw new Exception("Not authorized");
            return await LoadPollAsync(pollId, userId) ?? throw new Exception("Poll not found");
        }

        private async Task ProcessMentionsAsync(string content, string entityType, int entityId, int mentionerUserId, int channelId)
        {
            var usernames = Regex.Matches(content ?? "", @"@([A-Za-z0-9_]+)")
                .Select(m => m.Groups[1].Value)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (usernames.Count == 0) return;

            var users = await _context.Users.Where(u => usernames.Contains(u.UserName)).ToListAsync();
            var mentioner = await _context.Users.FindAsync(mentionerUserId);
            foreach (var user in users)
            {
                if (user.Id == mentionerUserId) continue;
                if (!await CanAccessChannelAsync(channelId, user.Id)) continue;
                var exists = await _context.Mentions.AnyAsync(m =>
                    m.EntityType == entityType &&
                    m.EntityId == entityId &&
                    m.MentionedUserId == user.Id);
                if (exists) continue;

                _context.Mentions.Add(new Mention
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    MentionedUserId = user.Id,
                    MentionerUserId = mentionerUserId,
                    CreatedAt = DateTime.UtcNow
                });
                await _notificationService.SendAsync(
                    user.Id,
                    "Ban duoc nhac den",
                    $"{mentioner?.Name ?? mentioner?.UserName ?? "Mot nguoi"} da nhac den ban trong kenh trao doi.",
                    "Mention",
                    entityId);
            }
            await _context.SaveChangesAsync();
        }

        private async Task<Post?> LoadPostAsync(int postId, int userId)
        {
            var post = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Comments)
                .Include(p => p.Likes)
                .Include(p => p.Poll).ThenInclude(p => p.Options)
                .Include(p => p.Poll).ThenInclude(p => p.Votes)
                .FirstOrDefaultAsync(p => p.Id == postId);
            if (post == null) return null;

            await HydratePostAuthorsAsync(new[] { post });

            post.CommentCount = post.Comments?.Count ?? 0;
            post.IsLikedByMe = post.Likes?.Any(l => l.UserId == userId) == true;
            if (post.Poll != null)
            {
                post.Poll.Options = post.Poll.Options.OrderBy(o => o.SortOrder).ToList();
                post.Poll.UserVotedOptionId = post.Poll.Votes.FirstOrDefault(v => v.UserId == userId)?.OptionId;
                post.Poll.Votes = new List<PollVote>();
            }
            post.Comments = new List<Comment>();
            post.Likes = new List<Like>();
            return post;
        }

        private async Task<Poll?> LoadPollAsync(int pollId, int userId)
        {
            var poll = await _context.Polls
                .Include(p => p.Options)
                .Include(p => p.Votes)
                .FirstOrDefaultAsync(p => p.Id == pollId);
            if (poll == null) return null;

            poll.Options = poll.Options.OrderBy(o => o.SortOrder).ToList();
            poll.UserVotedOptionId = poll.Votes.OrderBy(v => v.CreatedAt).FirstOrDefault(v => v.UserId == userId)?.OptionId;
            poll.Votes = new List<PollVote>();
            return poll;
        }

        private async Task HydratePostAuthorsAsync(IEnumerable<Post> posts)
        {
            var list = posts.Where(p => p.AuthorId > 0).ToList();
            if (list.Count == 0) return;
            var snapshots = await LoadAuthorSnapshotsAsync(list.Select(p => p.AuthorId));
            foreach (var post in list)
            {
                if (!snapshots.TryGetValue(post.AuthorId, out var author)) continue;
                post.AuthorDisplayName = author.DisplayName;
                post.AuthorUserName = author.UserName;
                post.AuthorRole = author.Role;
                post.AuthorRoleLabel = author.RoleLabel;
                post.AuthorAvatarUrl = author.AvatarUrl;
            }
        }

        private async Task HydrateCommentAuthorsAsync(IEnumerable<Comment> comments)
        {
            var list = comments.Where(c => c.AuthorId > 0).ToList();
            if (list.Count == 0) return;
            var snapshots = await LoadAuthorSnapshotsAsync(list.Select(c => c.AuthorId));
            foreach (var comment in list)
            {
                if (!snapshots.TryGetValue(comment.AuthorId, out var author)) continue;
                comment.AuthorDisplayName = author.DisplayName;
                comment.AuthorUserName = author.UserName;
                comment.AuthorRole = author.Role;
                comment.AuthorRoleLabel = author.RoleLabel;
                comment.AuthorAvatarUrl = author.AvatarUrl;
            }
        }

        private async Task<Dictionary<int, ChatAuthorSnapshot>> LoadAuthorSnapshotsAsync(IEnumerable<int> userIds)
        {
            var ids = userIds.Distinct().ToList();
            if (ids.Count == 0) return new Dictionary<int, ChatAuthorSnapshot>();

            var users = await _context.Users
                .Where(u => ids.Contains(u.Id))
                .Select(u => new { u.Id, u.Name, u.UserName, u.UserType, u.Image })
                .ToListAsync();

            var volunteerAvatars = await _context.VolunteerProfiles
                .Where(p => ids.Contains(p.UserId))
                .Select(p => new { p.UserId, p.AvatarUrl })
                .ToDictionaryAsync(p => p.UserId, p => p.AvatarUrl ?? "");

            var organizerLogos = await _context.OrganizerVerifications
                .Where(v => ids.Contains(v.OrganizerId))
                .OrderByDescending(v => v.Status == "Verified")
                .ThenByDescending(v => v.UpdatedAt ?? v.SubmittedAt)
                .Select(v => new { v.OrganizerId, v.LogoUrl })
                .ToListAsync();

            var organizerLogoMap = organizerLogos
                .GroupBy(v => v.OrganizerId)
                .ToDictionary(g => g.Key, g => g.First().LogoUrl ?? "");

            var sponsorLogos = await _context.SponsorProfiles
                .Where(p => ids.Contains(p.UserId))
                .Select(p => new { p.UserId, p.LogoUrl })
                .ToDictionaryAsync(p => p.UserId, p => p.LogoUrl ?? "");

            return users.ToDictionary(
                u => u.Id,
                u =>
                {
                    var role = RoleKey(u.UserType);
                    var avatar = (u.Image ?? "").Trim();
                    if (string.IsNullOrWhiteSpace(avatar) && volunteerAvatars.TryGetValue(u.Id, out var volunteerAvatar))
                        avatar = volunteerAvatar;
                    if (string.IsNullOrWhiteSpace(avatar) && organizerLogoMap.TryGetValue(u.Id, out var organizerLogo))
                        avatar = organizerLogo;
                    if (string.IsNullOrWhiteSpace(avatar) && sponsorLogos.TryGetValue(u.Id, out var sponsorLogo))
                        avatar = sponsorLogo;

                    return new ChatAuthorSnapshot(
                        DisplayName: FirstNonBlank(u.Name, u.UserName, "Người dùng"),
                        UserName: u.UserName ?? "",
                        Role: role,
                        RoleLabel: RoleLabel(u.UserType),
                        AvatarUrl: avatar ?? "");
                });
        }

        private static string FirstNonBlank(params string?[] values)
        {
            foreach (var value in values)
                if (!string.IsNullOrWhiteSpace(value)) return value.Trim();
            return "";
        }

        private static string RoleKey(int userType) => userType switch
        {
            1 => "Organizer",
            2 => "Sponsor",
            3 => "Admin",
            _ => "Volunteer"
        };

        private static string RoleLabel(int userType) => userType switch
        {
            1 => "Nhà tổ chức",
            2 => "Nhà tài trợ",
            3 => "Quản trị viên",
            _ => "Tình nguyện viên"
        };

        private static string NormalizePostType(string? postType)
        {
            var normalized = (postType ?? "discussion").Trim().ToLowerInvariant();
            return ValidPostTypes.Contains(normalized) ? normalized : "discussion";
        }

        private record ChatAuthorSnapshot(string DisplayName, string UserName, string Role, string RoleLabel, string AvatarUrl);
    }
}
