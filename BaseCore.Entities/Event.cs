using System;
using System.Collections.Generic;

namespace BaseCore.Entities
{
    public class Event
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int MaxParticipants { get; set; }
        public int CurrentParticipants { get; set; } = 0;
        public string RequiredSkillIds { get; set; } // JSON array, e.g. "[1,3]"
        public string Status { get; set; } = "Pending"; // Pending | Approved | Completed | Rejected | Cancelled
        public int CategoryId { get; set; }
        public int OrganizerId { get; set; }
        public string ImageUrl { get; set; }
        public string QrCode { get; set; } // auto-generated when Approved
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public EventCategory Category { get; set; }
        public User Organizer { get; set; }
        public List<Registration> Registrations { get; set; }
        public List<WorkShift> WorkShifts { get; set; }
        public Channel Channel { get; set; }
    }
}
