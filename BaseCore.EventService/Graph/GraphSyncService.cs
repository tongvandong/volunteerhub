using System.Text.Json;
using BaseCore.Repository;
using Microsoft.EntityFrameworkCore;
using Neo4j.Driver;

namespace BaseCore.EventService.Graph
{
    /// <summary>
    /// Knowledge-graph layer (Mức 1). SQL Server stays the system of record; this service
    /// mirrors a subset of the relational data into Neo4j (one-way, idempotent) and exposes
    /// graph-based recommendation queries.
    ///
    /// If Neo4j is not configured (no Neo4j:Uri), the service is disabled: sync is skipped and
    /// every query returns empty so the rest of the app keeps working unchanged.
    /// </summary>
    public sealed class GraphSyncService
    {
        private readonly IDriver? _driver;
        private readonly IServiceScopeFactory _scopes;
        private readonly ILogger<GraphSyncService> _logger;

        public bool Enabled => _driver != null;
        public TimeSpan SyncInterval { get; }
        public DateTime? LastSyncAt { get; private set; }

        public GraphSyncService(
            IServiceProvider provider,
            IServiceScopeFactory scopes,
            IConfiguration config,
            ILogger<GraphSyncService> logger)
        {
            _driver = provider.GetService<IDriver>(); // null when Neo4j is not configured
            _scopes = scopes;
            _logger = logger;
            var minutes = int.TryParse(config["Graph:SyncIntervalMinutes"], out var m) && m > 0 ? m : 20;
            SyncInterval = TimeSpan.FromMinutes(minutes);
        }

        // ---- schema ---------------------------------------------------------
        public async Task EnsureSchemaAsync(CancellationToken ct = default)
        {
            if (_driver == null) return;
            var constraints = new[]
            {
                "CREATE CONSTRAINT volunteer_id IF NOT EXISTS FOR (v:Volunteer) REQUIRE v.userId IS UNIQUE",
                "CREATE CONSTRAINT sponsor_id   IF NOT EXISTS FOR (s:Sponsor)   REQUIRE s.userId IS UNIQUE",
                "CREATE CONSTRAINT event_id     IF NOT EXISTS FOR (e:Event)     REQUIRE e.eventId IS UNIQUE",
                "CREATE CONSTRAINT skill_id     IF NOT EXISTS FOR (k:Skill)     REQUIRE k.skillId IS UNIQUE",
                "CREATE CONSTRAINT field_id     IF NOT EXISTS FOR (f:Field)     REQUIRE f.categoryId IS UNIQUE",
            };
            await using var session = _driver.AsyncSession();
            foreach (var c in constraints)
            {
                await session.ExecuteWriteAsync(tx => tx.RunAsync(c));
            }
        }

        // ---- full sync ------------------------------------------------------
        public async Task<GraphSyncResult> FullSyncAsync(CancellationToken ct = default)
        {
            if (_driver == null) return new GraphSyncResult(0, 0, 0);

            var startedAt = DateTimeOffset.UtcNow;
            var batch = startedAt.ToUnixTimeMilliseconds();

            using var scope = _scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MySqlDbContext>();

            // ---- pull the relevant slices from SQL (read-only) ----
            var volunteers = await (
                from u in db.Users.AsNoTracking()
                where u.IsActive && u.UserType == 0
                join p in db.VolunteerProfiles.AsNoTracking() on u.Id equals p.UserId into pp
                from p in pp.DefaultIfEmpty()
                select new { u.Id, u.Name, Hours = p != null ? p.TotalVolunteerHours : 0m, Kyc = p != null ? p.KycStatus : "Unverified" }
            ).ToListAsync(ct);

            var sponsors = await db.Users.AsNoTracking()
                .Where(u => u.IsActive && u.UserType == 2)
                .Select(u => new { u.Id, u.Name })
                .ToListAsync(ct);

            var skills = await db.Skills.AsNoTracking()
                .Select(s => new { s.Id, s.Name, s.Category })
                .ToListAsync(ct);

            var fields = await db.EventCategories.AsNoTracking()
                .Select(f => new { f.Id, f.Name })
                .ToListAsync(ct);

            var events = await db.Events.AsNoTracking()
                .Select(e => new { e.Id, e.Title, e.Status, e.StartDate, e.EndDate, e.CategoryId, e.RequiredSkillIds })
                .ToListAsync(ct);

            var volunteerSkills = await db.VolunteerSkills.AsNoTracking()
                .Select(vs => new { vs.UserId, vs.SkillId, vs.Level, vs.VerificationStatus })
                .ToListAsync(ct);

            var registrations = await db.Registrations.AsNoTracking()
                .Select(r => new { r.UserId, r.EventId, r.Status, r.IsAttended, r.VolunteerHours })
                .ToListAsync(ct);

            var eventSponsors = await db.EventSponsors.AsNoTracking()
                .Select(es => new { es.SponsorId, es.EventId, es.ContributionType, es.Amount })
                .ToListAsync(ct);

            // ---- build parameter rows ----
            static long Epoch(DateTime dt) => new DateTimeOffset(DateTime.SpecifyKind(dt, DateTimeKind.Utc)).ToUnixTimeMilliseconds();

            var volRows = volunteers.Select(v => (object)new Dictionary<string, object>
            {
                ["userId"] = v.Id, ["name"] = v.Name ?? "", ["hours"] = (double)v.Hours, ["kyc"] = v.Kyc ?? "Unverified"
            }).ToList();

            var sponsorRows = sponsors.Select(s => (object)new Dictionary<string, object>
            {
                ["userId"] = s.Id, ["name"] = s.Name ?? ""
            }).ToList();

            var skillRows = skills.Select(s => (object)new Dictionary<string, object>
            {
                ["skillId"] = s.Id, ["name"] = s.Name ?? "", ["category"] = s.Category ?? ""
            }).ToList();

            var fieldRows = fields.Select(f => (object)new Dictionary<string, object>
            {
                ["categoryId"] = f.Id, ["name"] = f.Name ?? ""
            }).ToList();

            var eventRows = events.Select(e => (object)new Dictionary<string, object>
            {
                ["eventId"] = e.Id, ["title"] = e.Title ?? "", ["status"] = e.Status ?? "",
                ["startEpoch"] = Epoch(e.StartDate), ["endEpoch"] = Epoch(e.EndDate), ["categoryId"] = e.CategoryId
            }).ToList();

            // event -> needed skill pairs (parse RequiredSkillIds JSON like "[1,3]")
            var validSkillIds = skills.Select(s => s.Id).ToHashSet();
            var needsSkillRows = new List<object>();
            foreach (var e in events)
            {
                foreach (var sid in ParseSkillIds(e.RequiredSkillIds))
                {
                    if (validSkillIds.Contains(sid))
                        needsSkillRows.Add(new Dictionary<string, object> { ["eventId"] = e.Id, ["skillId"] = sid });
                }
            }

            var hasSkillRows = volunteerSkills.Select(vs => (object)new Dictionary<string, object>
            {
                ["userId"] = vs.UserId, ["skillId"] = vs.SkillId,
                ["level"] = vs.Level ?? "", ["verified"] = vs.VerificationStatus == "Verified"
            }).ToList();

            var registeredRows = registrations.Select(r => (object)new Dictionary<string, object>
            {
                ["userId"] = r.UserId, ["eventId"] = r.EventId, ["status"] = r.Status ?? ""
            }).ToList();

            var participatedRows = registrations
                .Where(r => r.Status == "Confirmed" && r.IsAttended)
                .Select(r => (object)new Dictionary<string, object>
                {
                    ["userId"] = r.UserId, ["eventId"] = r.EventId, ["hours"] = (double)r.VolunteerHours
                }).ToList();

            var sponsoredRows = eventSponsors.Select(es => (object)new Dictionary<string, object>
            {
                ["sponsorId"] = es.SponsorId, ["eventId"] = es.EventId,
                ["type"] = es.ContributionType ?? "", ["amount"] = (double)es.Amount
            }).ToList();

            // ---- write to Neo4j (each block idempotent via MERGE) ----
            await using var session = _driver.AsyncSession();

            await WriteAsync(session, @"UNWIND $rows AS r
                MERGE (v:Volunteer {userId:r.userId})
                SET v.name=r.name, v.totalHours=r.hours, v.kycStatus=r.kyc, v.syncedAt=$batch", volRows, batch);

            await WriteAsync(session, @"UNWIND $rows AS r
                MERGE (s:Sponsor {userId:r.userId})
                SET s.name=r.name, s.syncedAt=$batch", sponsorRows, batch);

            await WriteAsync(session, @"UNWIND $rows AS r
                MERGE (k:Skill {skillId:r.skillId})
                SET k.name=r.name, k.category=r.category, k.syncedAt=$batch", skillRows, batch);

            await WriteAsync(session, @"UNWIND $rows AS r
                MERGE (f:Field {categoryId:r.categoryId})
                SET f.name=r.name, f.syncedAt=$batch", fieldRows, batch);

            await WriteAsync(session, @"UNWIND $rows AS r
                MERGE (e:Event {eventId:r.eventId})
                SET e.title=r.title, e.status=r.status, e.startEpoch=r.startEpoch, e.endEpoch=r.endEpoch, e.syncedAt=$batch
                WITH e, r
                MATCH (f:Field {categoryId:r.categoryId})
                MERGE (e)-[rel:IN_FIELD]->(f) SET rel.syncedAt=$batch", eventRows, batch);

            await WriteAsync(session, @"UNWIND $rows AS r
                MATCH (e:Event {eventId:r.eventId}) MATCH (k:Skill {skillId:r.skillId})
                MERGE (e)-[rel:NEEDS_SKILL]->(k) SET rel.syncedAt=$batch", needsSkillRows, batch);

            await WriteAsync(session, @"UNWIND $rows AS r
                MATCH (v:Volunteer {userId:r.userId}) MATCH (k:Skill {skillId:r.skillId})
                MERGE (v)-[rel:HAS_SKILL]->(k) SET rel.level=r.level, rel.verified=r.verified, rel.syncedAt=$batch", hasSkillRows, batch);

            await WriteAsync(session, @"UNWIND $rows AS r
                MATCH (v:Volunteer {userId:r.userId}) MATCH (e:Event {eventId:r.eventId})
                MERGE (v)-[rel:REGISTERED]->(e) SET rel.status=r.status, rel.syncedAt=$batch", registeredRows, batch);

            await WriteAsync(session, @"UNWIND $rows AS r
                MATCH (v:Volunteer {userId:r.userId}) MATCH (e:Event {eventId:r.eventId})
                MERGE (v)-[rel:PARTICIPATED]->(e) SET rel.hours=r.hours, rel.syncedAt=$batch", participatedRows, batch);

            await WriteAsync(session, @"UNWIND $rows AS r
                MATCH (s:Sponsor {userId:r.sponsorId}) MATCH (e:Event {eventId:r.eventId})
                MERGE (s)-[rel:SPONSORED]->(e) SET rel.type=r.type, rel.amount=r.amount, rel.syncedAt=$batch", sponsoredRows, batch);

            // ---- garbage-collect anything no longer present in SQL ----
            await session.ExecuteWriteAsync(tx => tx.RunAsync(
                "MATCH ()-[r]->() WHERE r.syncedAt < $batch DELETE r", new { batch }));
            await session.ExecuteWriteAsync(tx => tx.RunAsync(
                "MATCH (n) WHERE n.syncedAt < $batch DETACH DELETE n", new { batch }));

            LastSyncAt = DateTime.UtcNow;
            var (nodes, rels) = await CountAsync(session);
            var durationMs = (long)(DateTimeOffset.UtcNow - startedAt).TotalMilliseconds;
            _logger.LogInformation("Graph full sync done: {Nodes} nodes, {Rels} rels in {Ms}ms", nodes, rels, durationMs);
            return new GraphSyncResult(nodes, rels, durationMs);
        }

        // ---- recommendation queries ----------------------------------------
        public Task<IReadOnlyList<EventRecommendation>> RecommendEventsForVolunteerAsync(int userId, int limit)
            => ReadAsync(@"
                MATCH (v:Volunteer {userId:$userId})
                MATCH (e:Event {status:'Approved'})
                WHERE e.startEpoch > $now AND NOT (v)-[:REGISTERED]->(e)
                OPTIONAL MATCH (v)-[:HAS_SKILL]->(s:Skill)<-[:NEEDS_SKILL]-(e)
                OPTIONAL MATCH (v)-[:PARTICIPATED]->(:Event)-[:IN_FIELD]->(f:Field)<-[:IN_FIELD]-(e)
                WITH e, count(DISTINCT s) AS skillMatch, count(DISTINCT f) AS fieldMatch
                WHERE skillMatch + fieldMatch > 0
                RETURN e.eventId AS eventId, e.title AS title, skillMatch, fieldMatch,
                       skillMatch*3 + fieldMatch*2 AS score
                ORDER BY score DESC, e.startEpoch ASC LIMIT $limit",
                new { userId, now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), limit },
                r => new EventRecommendation(
                    r["eventId"].As<int>(), r["title"].As<string>(),
                    r["skillMatch"].As<int>(), r["fieldMatch"].As<int>(), r["score"].As<int>()));

        public Task<IReadOnlyList<VolunteerRecommendation>> RecommendVolunteersForEventAsync(int eventId, int limit)
            => ReadAsync(@"
                MATCH (e:Event {eventId:$eventId})
                MATCH (v:Volunteer)
                WHERE NOT (v)-[:REGISTERED]->(e)
                OPTIONAL MATCH (v)-[:HAS_SKILL]->(s:Skill)<-[:NEEDS_SKILL]-(e)
                OPTIONAL MATCH (v)-[:PARTICIPATED]->(pe:Event)-[:IN_FIELD]->(:Field)<-[:IN_FIELD]-(e)
                WITH v, count(DISTINCT s) AS skillMatch, count(DISTINCT pe) AS fieldExp
                WHERE skillMatch + fieldExp > 0
                RETURN v.userId AS userId, v.name AS name, skillMatch, v.totalHours AS hours,
                       skillMatch*3 + fieldExp + (CASE WHEN v.totalHours > 20 THEN 1 ELSE 0 END) AS score
                ORDER BY score DESC LIMIT $limit",
                new { eventId, limit },
                r => new VolunteerRecommendation(
                    r["userId"].As<int>(), r["name"].As<string>(),
                    r["skillMatch"].As<int>(), r["hours"].As<double>(), r["score"].As<int>()));

        public Task<IReadOnlyList<SponsorRecommendation>> RecommendSponsorsForEventAsync(int eventId, int limit)
            => ReadAsync(@"
                MATCH (e:Event {eventId:$eventId})-[:IN_FIELD]->(f:Field)
                MATCH (sp:Sponsor)-[:SPONSORED]->(past:Event)-[:IN_FIELD]->(f)
                WHERE NOT (sp)-[:SPONSORED]->(e)
                RETURN sp.userId AS sponsorId, sp.name AS name, count(DISTINCT past) AS pastInField
                ORDER BY pastInField DESC LIMIT $limit",
                new { eventId, limit },
                r => new SponsorRecommendation(
                    r["sponsorId"].As<int>(), r["name"].As<string>(), r["pastInField"].As<int>()));

        public Task<IReadOnlyList<SimilarVolunteer>> SimilarVolunteersAsync(int userId, int limit)
            => ReadAsync(@"
                MATCH (v:Volunteer {userId:$userId})-[:PARTICIPATED]->(e:Event)<-[:PARTICIPATED]-(o:Volunteer)
                WHERE o.userId <> $userId
                RETURN o.userId AS userId, o.name AS name, count(DISTINCT e) AS sharedEvents
                ORDER BY sharedEvents DESC LIMIT $limit",
                new { userId, limit },
                r => new SimilarVolunteer(
                    r["userId"].As<int>(), r["name"].As<string>(), r["sharedEvents"].As<int>()));

        public async Task<GraphHealth> HealthAsync()
        {
            if (_driver == null) return new GraphHealth(false, null, 0, 0, "Neo4j not configured");
            try
            {
                await using var session = _driver.AsyncSession(o => o.WithDefaultAccessMode(AccessMode.Read));
                var (nodes, rels) = await CountAsync(session);
                return new GraphHealth(true, LastSyncAt, nodes, rels, null);
            }
            catch (Exception ex)
            {
                return new GraphHealth(true, LastSyncAt, 0, 0, ex.Message);
            }
        }

        // ---- helpers --------------------------------------------------------
        private async Task<IReadOnlyList<T>> ReadAsync<T>(string cypher, object parameters, Func<IRecord, T> map)
        {
            if (_driver == null) return Array.Empty<T>();
            try
            {
                await using var session = _driver.AsyncSession(o => o.WithDefaultAccessMode(AccessMode.Read));
                return await session.ExecuteReadAsync(async tx =>
                {
                    var cursor = await tx.RunAsync(cypher, parameters);
                    var records = await cursor.ToListAsync();
                    return (IReadOnlyList<T>)records.Select(map).ToList();
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Graph query failed; returning empty (degraded)");
                return Array.Empty<T>();
            }
        }

        private static Task WriteAsync(IAsyncSession session, string cypher, List<object> rows, long batch)
        {
            if (rows.Count == 0) return Task.CompletedTask;
            return session.ExecuteWriteAsync(tx => tx.RunAsync(cypher, new { rows, batch }));
        }

        private static async Task<(long nodes, long rels)> CountAsync(IAsyncSession session)
        {
            var nodes = await session.ExecuteReadAsync(async tx =>
            {
                var c = await tx.RunAsync("MATCH (n) RETURN count(n) AS c");
                var rec = await c.SingleAsync();
                return rec["c"].As<long>();
            });
            var rels = await session.ExecuteReadAsync(async tx =>
            {
                var c = await tx.RunAsync("MATCH ()-[r]->() RETURN count(r) AS c");
                var rec = await c.SingleAsync();
                return rec["c"].As<long>();
            });
            return (nodes, rels);
        }

        private static IEnumerable<int> ParseSkillIds(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) yield break;
            int[]? ids = null;
            try { ids = JsonSerializer.Deserialize<int[]>(json); } catch { /* malformed -> skip */ }
            if (ids == null) yield break;
            foreach (var id in ids) yield return id;
        }
    }
}
