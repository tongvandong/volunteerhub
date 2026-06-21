namespace BaseCore.EventService.Graph
{
    // Kết quả gợi ý / trạng thái — trả thẳng ra JSON cho FE.
    public record EventRecommendation(int EventId, string Title, int SkillMatch, int FieldMatch, int Score);
    public record VolunteerRecommendation(int UserId, string Name, int SkillMatch, double Hours, int Score);
    public record SponsorRecommendation(int SponsorId, string Name, int PastInField);
    public record SimilarVolunteer(int UserId, string Name, int SharedEvents);

    public record GraphSyncResult(long Nodes, long Relationships, long DurationMs);

    public record GraphHealth(
        bool Enabled,
        DateTime? LastSyncAt,
        long Nodes,
        long Relationships,
        string? Error);
}
