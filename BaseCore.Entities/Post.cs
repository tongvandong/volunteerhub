using System;
using System.Collections.Generic;

namespace BaseCore.Entities
{
    public class Post
    {
        public int Id { get; set; }
        public int ChannelId { get; set; }
        public int AuthorId { get; set; }
        public string Content { get; set; }
        public string ImageUrl { get; set; }
        public int LikeCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Channel Channel { get; set; }
        public User Author { get; set; }
        public List<Comment> Comments { get; set; }
        public List<Like> Likes { get; set; }
    }
}
