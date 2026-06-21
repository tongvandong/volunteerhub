using BaseCore.Common;
using BaseCore.Entities;
using BaseCore.Repository;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.EventService.Demo
{
    /// <summary>
    /// Tạo bộ dữ liệu demo phong phú (xem docs/8-seed-du-lieu-demo.md). Idempotent: nhận biết qua
    /// username prefix "demo.". Chỉ nên gọi ở môi trường non-production.
    /// </summary>
    public sealed class DemoSeederService
    {
        public const string DemoPrefix = "demo.";
        private const string DemoPassword = "demo123";

        private readonly MySqlDbContext _db;
        private readonly ILogger<DemoSeederService> _logger;
        private readonly Random _rng = new(12345);

        public DemoSeederService(MySqlDbContext db, ILogger<DemoSeederService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public record SeedReport(bool AlreadySeeded, int Volunteers, int Organizers, int Sponsors,
            int Events, int Registrations, int Sponsorships, int Donations, int Ratings);

        // UserType: 0=Volunteer, 1=Organizer, 2=Sponsor, 3=Admin
        public async Task<SeedReport> SeedAsync(string scale, CancellationToken ct = default)
        {
            var (nVol, nOrg, nSpon, nEvents) = scale switch
            {
                "small" => (20, 4, 5, 25),
                "large" => (100, 15, 20, 120),
                _ => (50, 8, 10, 60), // medium
            };

            if (await _db.Users.AnyAsync(u => u.UserName == DemoPrefix + "org01", ct))
            {
                _logger.LogInformation("Demo data already present; skipping seed.");
                return new SeedReport(true, 0, 0, 0, 0, 0, 0, 0, 0);
            }

            var skills = await EnsureSkillsAsync(ct);
            var categories = await EnsureCategoriesAsync(ct);
            var badges = await EnsureBadgesAsync(ct);

            // ---- users ----
            var organizers = new List<User>();
            for (var i = 1; i <= nOrg; i++)
                organizers.Add(MakeUser($"{DemoPrefix}org{i:D2}", OrgNames[(i - 1) % OrgNames.Length] + $" #{i}", 1, i));
            var sponsors = new List<User>();
            for (var i = 1; i <= nSpon; i++)
                sponsors.Add(MakeUser($"{DemoPrefix}spon{i:D2}", SponsorNames[(i - 1) % SponsorNames.Length] + $" #{i}", 2, i));
            var volunteers = new List<User>();
            for (var i = 1; i <= nVol; i++)
                volunteers.Add(MakeUser($"{DemoPrefix}vol{i:D2}", PersonName(i), 0, i));

            _db.Users.AddRange(organizers);
            _db.Users.AddRange(sponsors);
            _db.Users.AddRange(volunteers);
            await _db.SaveChangesAsync(ct);

            // ---- profiles ----
            foreach (var o in organizers)
            {
                _db.OrganizerVerifications.Add(new OrganizerVerification
                {
                    OrganizerId = o.Id,
                    OrganizationName = o.Name,
                    RepresentativeName = o.Name,
                    ContactEmail = o.Email,
                    Phone = o.Phone,
                    Address = City(),
                    Description = "Tổ chức tình nguyện (demo).",
                    DocumentUrl = "",
                    CommitmentAccepted = true,
                    Status = _rng.Next(10) < 8 ? "Verified" : "PendingVerification",
                    SubmittedAt = DaysAgo(_rng.Next(60, 300)),
                });
            }
            foreach (var s in sponsors)
            {
                _db.SponsorProfiles.Add(new SponsorProfile
                {
                    UserId = s.Id,
                    OrganizationName = s.Name,
                    RepresentativeName = PersonName(_rng.Next(1, 200)),
                    ContactEmail = s.Email,
                    Phone = s.Phone,
                    Description = "Nhà tài trợ (demo).",
                    IsVerified = _rng.Next(10) < 7,
                });
            }
            foreach (var v in volunteers)
            {
                var kyc = _rng.Next(100);
                _db.VolunteerProfiles.Add(new VolunteerProfile
                {
                    UserId = v.Id,
                    BloodType = BloodTypes[_rng.Next(BloodTypes.Length)],
                    Interests = string.Join(", ", PickMany(InterestPool, _rng.Next(1, 4))),
                    Bio = "Tình nguyện viên nhiệt huyết (demo).",
                    KycStatus = kyc < 60 ? "Verified" : kyc < 85 ? "PendingVerification" : "Unverified",
                });
            }
            await _db.SaveChangesAsync(ct);

            // ---- volunteer skills (clustered by category index) ----
            var skillVs = new List<VolunteerSkill>();
            foreach (var v in volunteers)
            {
                var picked = PickMany(skills, _rng.Next(2, 6));
                foreach (var sk in picked)
                {
                    var vs = _rng.Next(100);
                    skillVs.Add(new VolunteerSkill
                    {
                        UserId = v.Id,
                        SkillId = sk.Id,
                        Level = SkillLevels[_rng.Next(SkillLevels.Length)],
                        VerificationStatus = vs < 50 ? "Verified" : vs < 80 ? "SelfDeclared" : "PendingVerification",
                    });
                }
            }
            _db.VolunteerSkills.AddRange(skillVs);
            await _db.SaveChangesAsync(ct);

            // ---- events ----
            // status mix proportional to nEvents (medium reference: 25/20/8/4/3 of 60)
            var completed = nEvents * 25 / 60;
            var approved = nEvents * 20 / 60;
            var pending = nEvents * 8 / 60;
            var rejected = nEvents * 4 / 60;
            var cancelled = Math.Max(0, nEvents - completed - approved - pending - rejected);

            var events = new List<Event>();
            void AddEvents(int count, string status)
            {
                for (var i = 0; i < count; i++)
                {
                    var cat = categories[_rng.Next(categories.Count)];
                    var clusterSkills = SkillsForCategory(skills, categories, cat);
                    var reqSkills = PickMany(clusterSkills, _rng.Next(1, Math.Min(4, clusterSkills.Count + 1)))
                        .Select(s => s.Id).ToList();
                    var organizer = organizers[_rng.Next(organizers.Count)];

                    DateTime start, end;
                    if (status == "Completed") { start = DaysAgo(_rng.Next(20, 180)); }
                    else if (status == "Approved" || status == "Pending") { start = DaysAhead(_rng.Next(5, 90)); }
                    else { start = DaysAhead(_rng.Next(-30, 30)); }
                    end = start.AddHours(_rng.Next(3, 8));

                    var (lat, lng, city) = CityGeo();
                    var seedIndex = events.Count + 1;
                    events.Add(new Event
                    {
                        Title = $"{EventTitle(cat.Name)} tại {city}",
                        Description = $"Sự kiện {cat.Name.ToLower()} (demo) — chung tay vì cộng đồng.",
                        // Ảnh minh hoạ ổn định theo seed để demo sinh động (picsum trả cùng ảnh cho cùng seed).
                        ImageUrl = $"https://picsum.photos/seed/vhub{seedIndex}/640/400",
                        Location = city,
                        Latitude = (decimal)lat,
                        Longitude = (decimal)lng,
                        StartDate = start,
                        EndDate = end,
                        MinParticipants = _rng.Next(3, 8),
                        MaxParticipants = _rng.Next(20, 80),
                        RequiresKyc = _rng.Next(5) == 0,
                        RequiresInterview = _rng.Next(6) == 0,
                        RequiredSkillIds = System.Text.Json.JsonSerializer.Serialize(reqSkills),
                        Status = status,
                        CategoryId = cat.Id,
                        OrganizerId = organizer.Id,
                        CreatedAt = DaysAgo(_rng.Next(30, 200)),
                        RejectReason = status == "Rejected" ? "Hồ sơ chưa đầy đủ (demo)." : "",
                        CancelReason = status == "Cancelled" ? "Thay đổi kế hoạch (demo)." : "",
                    });
                }
            }
            AddEvents(completed, "Completed");
            AddEvents(approved, "Approved");
            AddEvents(pending, "Pending");
            AddEvents(rejected, "Rejected");
            AddEvents(cancelled, "Cancelled");
            _db.Events.AddRange(events);
            await _db.SaveChangesAsync(ct);

            // ---- registrations (+ attendance for completed) ----
            var regs = new List<Registration>();
            var hoursByUser = new Dictionary<int, decimal>();
            foreach (var ev in events)
            {
                if (ev.Status is "Rejected" or "Cancelled" or "Pending") continue;
                var participants = PickMany(volunteers, _rng.Next(8, 22));
                foreach (var v in participants)
                {
                    if (ev.Status == "Completed")
                    {
                        var hours = (decimal)Math.Round((ev.EndDate - ev.StartDate).TotalHours, 1);
                        regs.Add(new Registration
                        {
                            EventId = ev.Id, UserId = v.Id, Status = "Confirmed",
                            RegisteredAt = ev.CreatedAt, ConfirmedAt = ev.CreatedAt.AddDays(1),
                            IsAttended = true, AttendedAt = ev.StartDate, VolunteerHours = hours,
                        });
                        hoursByUser[v.Id] = hoursByUser.GetValueOrDefault(v.Id) + hours;
                    }
                    else // Approved upcoming
                    {
                        regs.Add(new Registration
                        {
                            EventId = ev.Id, UserId = v.Id,
                            Status = _rng.Next(2) == 0 ? "Confirmed" : "Pending",
                            RegisteredAt = DaysAgo(_rng.Next(1, 20)),
                        });
                    }
                }
                ev.CurrentParticipants = participants.Count;
            }
            _db.Registrations.AddRange(regs);
            await _db.SaveChangesAsync(ct);

            // ---- event sponsors (sponsor concentrates on 1-2 categories) ----
            var eventSponsors = new List<EventSponsor>();
            var completedAndApproved = events.Where(e => e.Status is "Completed" or "Approved").ToList();
            foreach (var sp in sponsors)
            {
                var favCats = PickMany(categories, _rng.Next(1, 3)).Select(c => c.Id).ToHashSet();
                var targets = PickMany(completedAndApproved.Where(e => favCats.Contains(e.CategoryId)).ToList(), _rng.Next(2, 6));
                foreach (var ev in targets)
                {
                    eventSponsors.Add(new EventSponsor
                    {
                        EventId = ev.Id, SponsorId = sp.Id,
                        ContributionType = _rng.Next(2) == 0 ? "Financial" : "Supplies",
                        Amount = _rng.Next(5, 100) * 1_000_000m,
                        Note = "Tài trợ (demo).",
                        SponsoredAt = ev.CreatedAt.AddDays(_rng.Next(1, 10)),
                    });
                }
            }
            _db.EventSponsors.AddRange(eventSponsors);
            await _db.SaveChangesAsync(ct);

            // ---- support campaigns + donations ----
            var campaigns = new List<SupportCampaign>();
            foreach (var ev in PickMany(events.Where(e => e.Status is "Completed" or "Approved").ToList(), Math.Max(5, nEvents / 4)))
            {
                campaigns.Add(new SupportCampaign
                {
                    EventId = ev.Id, Title = $"Gây quỹ: {ev.Title}",
                    Description = "Chiến dịch gây quỹ (demo).",
                    TargetAmount = _rng.Next(10, 200) * 1_000_000m,
                    StartDate = ev.CreatedAt, EndDate = ev.EndDate.AddDays(30),
                    BankBin = "970422", BankAccountNo = "0123456789", BankAccountName = "QUY THIEN NGUYEN",
                    Status = "Active", CreatedBy = ev.OrganizerId, CreatedAt = ev.CreatedAt,
                });
            }
            _db.SupportCampaigns.AddRange(campaigns);
            await _db.SaveChangesAsync(ct);

            var donations = new List<IndividualDonation>();
            var donatedByUser = new Dictionary<int, (decimal amt, int cnt)>();
            foreach (var camp in campaigns)
            {
                foreach (var v in PickMany(volunteers, _rng.Next(5, 15)))
                {
                    var amt = _rng.Next(1, 50) * 100_000m;
                    var anon = _rng.Next(5) == 0;
                    donations.Add(new IndividualDonation
                    {
                        CampaignId = camp.Id, UserId = v.Id, Amount = amt,
                        DisplayName = anon ? "" : volunteers.First(x => x.Id == v.Id).Name,
                        IsAnonymous = anon, Status = _rng.Next(10) < 8 ? "Confirmed" : "PendingConfirmation",
                        CreatedAt = camp.CreatedAt.AddDays(_rng.Next(1, 20)),
                    });
                    var cur = donatedByUser.GetValueOrDefault(v.Id);
                    donatedByUser[v.Id] = (cur.amt + amt, cur.cnt + 1);
                }
            }
            _db.IndividualDonations.AddRange(donations);
            await _db.SaveChangesAsync(ct);

            // ---- ratings for completed events ----
            var ratings = new List<Rating>();
            foreach (var ev in events.Where(e => e.Status == "Completed"))
            {
                var attended = regs.Where(r => r.EventId == ev.Id && r.IsAttended).Take(8).ToList();
                foreach (var r in attended)
                {
                    if (_rng.Next(10) < 7)
                        ratings.Add(new Rating { EventId = ev.Id, RaterId = ev.OrganizerId, RateeId = r.UserId, Score = _rng.Next(3, 6), Comment = "Tích cực (demo).", CreatedAt = ev.EndDate.AddDays(1) });
                    if (_rng.Next(10) < 5)
                        ratings.Add(new Rating { EventId = ev.Id, RaterId = r.UserId, RateeId = ev.OrganizerId, Score = _rng.Next(3, 6), Comment = "Tổ chức tốt (demo).", CreatedAt = ev.EndDate.AddDays(1) });
                }
            }
            _db.Ratings.AddRange(ratings);
            await _db.SaveChangesAsync(ct);

            // ---- update aggregates + badges ----
            var profiles = await _db.VolunteerProfiles
                .Where(p => volunteers.Select(v => v.Id).Contains(p.UserId)).ToListAsync(ct);
            var userBadges = new List<UserBadge>();
            foreach (var p in profiles)
            {
                p.TotalVolunteerHours = hoursByUser.GetValueOrDefault(p.UserId);
                var don = donatedByUser.GetValueOrDefault(p.UserId);
                p.TotalDonatedAmount = don.amt;
                p.DonationCount = don.cnt;
                if (p.TotalVolunteerHours >= 20 && badges.Count > 0)
                    userBadges.Add(new UserBadge { UserId = p.UserId, BadgeId = badges[0].Id });
                if (p.TotalVolunteerHours >= 50 && badges.Count > 1)
                    userBadges.Add(new UserBadge { UserId = p.UserId, BadgeId = badges[1].Id });
            }
            _db.UserBadges.AddRange(userBadges);
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation("Demo seed done: {V} vol, {E} events, {R} regs", volunteers.Count, events.Count, regs.Count);
            return new SeedReport(false, volunteers.Count, organizers.Count, sponsors.Count,
                events.Count, regs.Count, eventSponsors.Count, donations.Count, ratings.Count);
        }

        public async Task<int> ClearAsync(CancellationToken ct = default)
        {
            var demoUserIds = await _db.Users.Where(u => u.UserName.StartsWith(DemoPrefix))
                .Select(u => u.Id).ToListAsync(ct);
            if (demoUserIds.Count == 0) return 0;
            var demoUserSet = demoUserIds.ToHashSet();

            var demoEventIds = await _db.Events.Where(e => demoUserSet.Contains(e.OrganizerId))
                .Select(e => e.Id).ToListAsync(ct);
            var demoCampaignIds = await _db.SupportCampaigns.Where(c => demoEventIds.Contains(c.EventId))
                .Select(c => c.Id).ToListAsync(ct);

            // delete in FK-safe order
            _db.IndividualDonations.RemoveRange(_db.IndividualDonations.Where(d => demoCampaignIds.Contains(d.CampaignId) || demoUserSet.Contains(d.UserId)));
            _db.SupportCampaigns.RemoveRange(_db.SupportCampaigns.Where(c => demoEventIds.Contains(c.EventId)));
            _db.Ratings.RemoveRange(_db.Ratings.Where(r => demoEventIds.Contains(r.EventId) || demoUserSet.Contains(r.RaterId) || demoUserSet.Contains(r.RateeId)));
            _db.EventSponsors.RemoveRange(_db.EventSponsors.Where(s => demoEventIds.Contains(s.EventId) || demoUserSet.Contains(s.SponsorId)));
            _db.Registrations.RemoveRange(_db.Registrations.Where(r => demoEventIds.Contains(r.EventId) || demoUserSet.Contains(r.UserId)));
            _db.Events.RemoveRange(_db.Events.Where(e => demoEventIds.Contains(e.Id)));
            _db.VolunteerSkills.RemoveRange(_db.VolunteerSkills.Where(v => demoUserSet.Contains(v.UserId)));
            _db.VolunteerProfiles.RemoveRange(_db.VolunteerProfiles.Where(p => demoUserSet.Contains(p.UserId)));
            _db.SponsorProfiles.RemoveRange(_db.SponsorProfiles.Where(p => demoUserSet.Contains(p.UserId)));
            _db.OrganizerVerifications.RemoveRange(_db.OrganizerVerifications.Where(o => demoUserSet.Contains(o.OrganizerId)));
            _db.UserBadges.RemoveRange(_db.UserBadges.Where(b => demoUserSet.Contains(b.UserId)));
            _db.Users.RemoveRange(_db.Users.Where(u => demoUserSet.Contains(u.Id)));
            await _db.SaveChangesAsync(ct);
            return demoUserIds.Count;
        }

        // ---- helpers ----
        private User MakeUser(string username, string name, int userType, int i)
        {
            var hash = TokenHelper.HashPassword(DemoPassword, out var salt);
            return new User
            {
                Name = name, UserName = username, Password = hash, Salt = salt,
                Email = $"{username}@demo.volunteerhub.vn", Phone = $"09{_rng.Next(10000000, 99999999)}",
                Position = userType == 1 ? "Organizer" : userType == 2 ? "Sponsor" : "Volunteer",
                Contact = "", Image = "", IsActive = true, UserType = userType, Created = DateTime.UtcNow,
            };
        }

        private async Task<List<Skill>> EnsureSkillsAsync(CancellationToken ct)
        {
            foreach (var (name, cat) in SkillSeed)
                if (!await _db.Skills.AnyAsync(s => s.Name == name, ct))
                    _db.Skills.Add(new Skill { Name = name, Category = cat });
            await _db.SaveChangesAsync(ct);
            return await _db.Skills.AsNoTracking().ToListAsync(ct);
        }

        private async Task<List<EventCategory>> EnsureCategoriesAsync(CancellationToken ct)
        {
            foreach (var name in CategorySeed)
                if (!await _db.EventCategories.AnyAsync(c => c.Name == name, ct))
                    _db.EventCategories.Add(new EventCategory { Name = name, Description = name, Icon = "fa-hand-holding-heart" });
            await _db.SaveChangesAsync(ct);
            return await _db.EventCategories.AsNoTracking().ToListAsync(ct);
        }

        private async Task<List<Badge>> EnsureBadgesAsync(CancellationToken ct)
        {
            var seed = new[]
            {
                ("Người mới nhiệt huyết", "{\"min_hours\":20}"),
                ("Tình nguyện viên bền bỉ", "{\"min_hours\":50}"),
                ("Nhà hảo tâm", "{\"min_donations\":1}"),
            };
            foreach (var (name, cond) in seed)
                if (!await _db.Badges.AnyAsync(b => b.Name == name, ct))
                    _db.Badges.Add(new Badge { Name = name, Description = name, IconUrl = "", Condition = cond });
            await _db.SaveChangesAsync(ct);
            return await _db.Badges.AsNoTracking().ToListAsync(ct);
        }

        // map skills to a category by round-robin so events/volunteers form overlapping clusters
        private static List<Skill> SkillsForCategory(List<Skill> skills, List<EventCategory> cats, EventCategory cat)
        {
            var idx = cats.FindIndex(c => c.Id == cat.Id);
            var n = cats.Count == 0 ? 1 : cats.Count;
            var subset = skills.Where((s, i) => i % n == idx % n).ToList();
            return subset.Count > 0 ? subset : skills;
        }

        private List<T> PickMany<T>(IList<T> source, int count)
        {
            if (source.Count == 0) return new List<T>();
            count = Math.Min(count, source.Count);
            return source.OrderBy(_ => _rng.Next()).Take(count).ToList();
        }

        private DateTime DaysAgo(int d) => DateTime.UtcNow.AddDays(-d);
        private DateTime DaysAhead(int d) => DateTime.UtcNow.AddDays(d);
        private string City() => Cities[_rng.Next(Cities.Length)].name;
        private (double lat, double lng, string name) CityGeo() => Cities[_rng.Next(Cities.Length)];
        private string PersonName(int i) => $"{FamilyNames[i % FamilyNames.Length]} {MiddleNames[(i / 7) % MiddleNames.Length]} {GivenNames[(i * 3) % GivenNames.Length]}";

        // ---- seed data pools ----
        private static readonly (string name, string cat)[] SkillSeed =
        {
            ("Sơ cứu","Y tế"), ("Điều dưỡng","Y tế"), ("Tư vấn tâm lý","Y tế"),
            ("Dạy học","Giáo dục"), ("Tiếng Anh","Giáo dục"), ("Tin học","Giáo dục"),
            ("Trồng cây","Môi trường"), ("Phân loại rác","Môi trường"), ("Dọn dẹp","Môi trường"),
            ("MC dẫn chương trình","Sự kiện"), ("Nhiếp ảnh","Sự kiện"), ("Truyền thông","Sự kiện"),
            ("Lái xe","Hỗ trợ"), ("Hậu cần","Hỗ trợ"), ("Nấu ăn","Hỗ trợ"),
            ("Gây quỹ","Cộng đồng"), ("Tổ chức sự kiện","Cộng đồng"), ("Ngôn ngữ ký hiệu","Cộng đồng"),
            ("Chăm sóc động vật","Động vật"), ("Thiết kế đồ họa","Sự kiện"),
        };

        private static readonly string[] CategorySeed =
        {
            "Môi trường", "Giáo dục", "Y tế", "Cộng đồng",
            "Thiên tai - Cứu trợ", "Trẻ em", "Người cao tuổi", "Động vật",
        };

        private static readonly (double lat, double lng, string name)[] Cities =
        {
            (21.0278,105.8342,"Hà Nội"), (10.7769,106.7009,"TP. Hồ Chí Minh"),
            (16.0544,108.2022,"Đà Nẵng"), (16.4637,107.5909,"Huế"),
            (10.0452,105.7469,"Cần Thơ"), (20.8449,106.6881,"Hải Phòng"),
            (12.2388,109.1967,"Nha Trang"), (11.9404,108.4583,"Đà Lạt"),
        };

        private static readonly string[] FamilyNames = { "Nguyễn","Trần","Lê","Phạm","Hoàng","Phan","Vũ","Đặng","Bùi","Đỗ","Hồ","Ngô","Dương","Lý" };
        private static readonly string[] MiddleNames = { "Văn","Thị","Hữu","Đức","Minh","Thanh","Quang","Ngọc","Gia","Khánh" };
        private static readonly string[] GivenNames = { "An","Bình","Châu","Dũng","Hà","Hùng","Lan","Linh","Mai","Nam","Phúc","Quân","Trang","Tú","Vy","Yến","Khoa","Thảo","Sơn","Hương" };
        private static readonly string[] OrgNames = { "CLB Tình Nguyện Trẻ","Nhóm Thiện Nguyện Ánh Sáng","Hội Chữ Thập Đỏ","Mái Ấm Yêu Thương","Quỹ Vì Cộng Đồng" };
        private static readonly string[] SponsorNames = { "Công ty TNHH An Phát","Tập đoàn Hòa Bình","Ngân hàng Vạn Tín","Quỹ Đầu Tư Xanh","Công ty CP Minh Long" };
        private static readonly string[] InterestPool = { "Môi trường","Giáo dục","Y tế","Trẻ em","Người cao tuổi","Động vật","Cộng đồng" };
        private static readonly string[] BloodTypes = { "A","B","O","AB","" };
        private static readonly string[] SkillLevels = { "Beginner","Intermediate","Expert" };

        private static string EventTitle(string cat) => cat switch
        {
            "Môi trường" => "Ngày hội trồng cây xanh",
            "Giáo dục" => "Lớp học yêu thương",
            "Y tế" => "Khám bệnh phát thuốc miễn phí",
            "Thiên tai - Cứu trợ" => "Cứu trợ vùng lũ",
            "Trẻ em" => "Trung thu cho em",
            "Người cao tuổi" => "Thăm hỏi người cao tuổi",
            "Động vật" => "Giải cứu động vật hoang dã",
            _ => "Ngày hội tình nguyện cộng đồng",
        };
    }
}
