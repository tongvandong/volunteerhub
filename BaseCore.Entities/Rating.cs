using System;

namespace BaseCore.Entities
{
    public class Rating
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int RaterId { get; set; }   // người đánh giá
        public int RateeId { get; set; }   // người được đánh giá
        public int Score { get; set; }     // 1-5
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Event Event { get; set; }
        public User Rater { get; set; }
        public User Ratee { get; set; }
    }
}
