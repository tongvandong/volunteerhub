namespace BaseCore.Entities
{
    public class VolunteerProfile
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string BloodType { get; set; }
        public string Languages { get; set; }
        public string Interests { get; set; }
        public decimal TotalVolunteerHours { get; set; } = 0;
        public string Bio { get; set; }
        public string AvatarUrl { get; set; }

        // Navigation
        public User User { get; set; }
    }
}
