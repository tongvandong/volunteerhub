-- ============================================================
-- VolunteerHub Demo Data Reset
-- SQL Server database: VolunteerHub
--
-- Run through scripts/reset-demo-data.ps1 so seed_data.sql is applied
-- immediately after this cleanup step.
-- ============================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DELETE FROM dbo.AuditLogs;
    DELETE FROM dbo.AuthRefreshTokens;

    DELETE FROM dbo.CertificateJobs;
    DELETE FROM dbo.UserBadges;
    DELETE FROM dbo.Certificates;
    DELETE FROM dbo.Ratings;

    DELETE FROM dbo.Likes;
    DELETE FROM dbo.Comments;
    DELETE FROM dbo.Posts;

    DELETE FROM dbo.Notifications;
    DELETE FROM dbo.Registrations;
    DELETE FROM dbo.IndividualDonations;
    DELETE FROM dbo.SupportCampaigns;
    DELETE FROM dbo.SponsorshipProposals;
    DELETE FROM dbo.EventSponsors;
    DELETE FROM dbo.SponsorProjectMilestones;
    DELETE FROM dbo.WorkShifts;
    DELETE FROM dbo.Channels;

    -- Keep EF baseline events 1-3; seed_data.sql restores events 4-13.
    DELETE FROM dbo.Events
    WHERE Id > 3 OR Title LIKE N'Codex QA%';

    DELETE FROM dbo.VolunteerSkills;
    DELETE FROM dbo.VolunteerProfiles WHERE Id <> 1;

    DELETE FROM dbo.Badges WHERE Id > 3 OR Name LIKE N'Codex QA%';
    DELETE FROM dbo.Skills WHERE Id > 7 OR Name LIKE N'Codex QA%';
    DELETE FROM dbo.EventCategories WHERE Id > 4 OR Name LIKE N'Codex QA%';

    -- Keep the four documented demo users.
    DELETE FROM dbo.Users
    WHERE Id > 4
       OR UserName LIKE N'Codex QA%'
       OR UserName LIKE N'flow%';

    UPDATE dbo.Users
    SET IsActive = 1, UserType = 3, Name = N'Administrator', Email = N'admin@volunteerhub.vn', Position = N'Admin'
    WHERE Id = 1;

    UPDATE dbo.Users
    SET IsActive = 1, UserType = 1, Name = N'Nguyen Van Minh', Email = N'organizer@volunteerhub.vn', Position = N'Organizer'
    WHERE Id = 2;

    UPDATE dbo.Users
    SET IsActive = 1, UserType = 2, Name = N'Tran Thi Lan', Email = N'sponsor@volunteerhub.vn', Position = N'Sponsor'
    WHERE Id = 3;

    UPDATE dbo.Users
    SET IsActive = 1, UserType = 0, Name = N'Le Van Hung', Email = N'volunteer@volunteerhub.vn', Position = N'Volunteer'
    WHERE Id = 4;

    UPDATE dbo.Events
    SET CurrentParticipants = 0, Status = N'Pending', QrCode = N'', RequiredSkillIds = N'[4]'
    WHERE Id = 1;

    UPDATE dbo.Events
    SET CurrentParticipants = 1, Status = N'Approved', QrCode = N'EVT-2025-0002', RequiredSkillIds = N'[]'
    WHERE Id = 2;

    UPDATE dbo.Events
    SET CurrentParticipants = 1, Status = N'Completed', QrCode = N'EVT-2025-0003', RequiredSkillIds = N'[3,6]'
    WHERE Id = 3;

    IF EXISTS (SELECT 1 FROM dbo.VolunteerProfiles WHERE Id = 1)
    BEGIN
        UPDATE dbo.VolunteerProfiles
        SET UserId = 4,
            BloodType = N'O',
            Languages = N'Tiếng Việt, Tiếng Anh',
            Interests = N'Môi trường, Giáo dục',
            TotalVolunteerHours = 0,
            Bio = N'Tình nguyện viên nhiệt huyết',
            AvatarUrl = N''
        WHERE Id = 1;
    END
    ELSE
    BEGIN
        SET IDENTITY_INSERT dbo.VolunteerProfiles ON;
        INSERT INTO dbo.VolunteerProfiles
            (Id, UserId, BloodType, Languages, Interests, TotalVolunteerHours, Bio, AvatarUrl)
        VALUES
            (1, 4, N'O', N'Tiếng Việt, Tiếng Anh', N'Môi trường, Giáo dục', 0, N'Tình nguyện viên nhiệt huyết', N'');
        SET IDENTITY_INSERT dbo.VolunteerProfiles OFF;
    END

    DBCC CHECKIDENT ('dbo.Users', RESEED, 4) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.EventCategories', RESEED, 4) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Skills', RESEED, 7) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Badges', RESEED, 3) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Events', RESEED, 3) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.WorkShifts', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Channels', RESEED, 2) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Posts', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Registrations', RESEED, 2) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.IndividualDonations', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.SupportCampaigns', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.SponsorshipProposals', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.EventSponsors', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.SponsorProjectMilestones', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Notifications', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.Certificates', RESEED, 1) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.CertificateJobs', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.UserBadges', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.VolunteerSkills', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.AuditLogs', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('dbo.AuthRefreshTokens', RESEED, 0) WITH NO_INFOMSGS;

    COMMIT TRANSACTION;
    PRINT N'VolunteerHub demo cleanup completed. Run seed_data.sql next.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
