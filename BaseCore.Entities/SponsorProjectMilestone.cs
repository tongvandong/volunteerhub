using System;

namespace BaseCore.Entities
{
    public class SponsorProjectMilestone
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = "Planned"; // Planned | InProgress | Completed | Blocked
        public int ProgressPercent { get; set; }
        public int SortOrder { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAtUtc { get; set; }
        public DateTime? CompletedAtUtc { get; set; }

        public Event Event { get; set; }
    }
}
