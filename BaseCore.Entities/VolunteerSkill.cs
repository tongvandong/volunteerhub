namespace BaseCore.Entities
{
    public class VolunteerSkill
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int SkillId { get; set; }
        public string Level { get; set; } // "Beginner", "Intermediate", "Expert"

        // Navigation
        public User User { get; set; }
        public Skill Skill { get; set; }
    }
}
