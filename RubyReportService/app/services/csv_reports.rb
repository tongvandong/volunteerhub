require "csv"
require "time"

require_relative "database"

module VolunteerHub
  module ReportService
    class CsvReports
      def summary
        Database.with_client do |client|
          {
            service: "RubyReportService",
            generatedAt: Time.now.utc.iso8601,
            totals: {
              events: scalar(client, "SELECT COUNT(*) FROM Events"),
              registrations: scalar(client, "SELECT COUNT(*) FROM Registrations"),
              supportCampaigns: scalar(client, "SELECT COUNT(*) FROM SupportCampaigns"),
              donations: scalar(client, "SELECT COUNT(*) FROM IndividualDonations"),
              confirmedDonationAmount: scalar(
                client,
                "SELECT COALESCE(SUM(Amount), 0) FROM IndividualDonations WHERE Status = 'Confirmed'"
              )
            }
          }
        end
      end

      def events_csv(limit:)
        headers = [
          "id",
          "title",
          "status",
          "category",
          "organizer",
          "location",
          "start_date",
          "end_date",
          "min_participants",
          "max_participants",
          "current_participants",
          "registration_count",
          "confirmed_count",
          "attended_count",
          "created_at"
        ]

        rows = query_rows(events_sql(limit))
        build_csv(headers, rows)
      end

      def donations_csv(limit:)
        headers = [
          "id",
          "status",
          "amount",
          "display_name",
          "email",
          "campaign",
          "event",
          "donor_username",
          "confirmed_by",
          "created_at",
          "confirmed_at"
        ]

        rows = query_rows(donations_sql(limit))
        build_csv(headers, rows)
      end

      private

      def query_rows(sql)
        Database.with_client do |client|
          rows = []
          client.execute(sql).each(as: :hash) { |row| rows << row }
          rows
        end
      end

      def scalar(client, sql)
        row = nil
        client.execute(sql).each(as: :array) do |current|
          row = current
          break
        end
        row&.first || 0
      end

      def build_csv(headers, rows)
        CSV.generate(write_headers: true, headers: headers) do |csv|
          rows.each do |row|
            csv << headers.map { |header| normalize_value(row[header]) }
          end
        end
      end

      def normalize_value(value)
        return value.utc.iso8601 if value.respond_to?(:utc)

        value
      end

      def events_sql(limit)
        safe_limit = Integer(limit)
        <<~SQL
          SELECT TOP (#{safe_limit})
            e.Id AS id,
            e.Title AS title,
            e.Status AS status,
            ec.Name AS category,
            COALESCE(u.Name, u.UserName, '') AS organizer,
            e.Location AS location,
            e.StartDate AS start_date,
            e.EndDate AS end_date,
            e.MinParticipants AS min_participants,
            e.MaxParticipants AS max_participants,
            e.CurrentParticipants AS current_participants,
            COUNT(r.Id) AS registration_count,
            SUM(CASE WHEN r.Status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
            SUM(CASE WHEN r.IsAttended = 1 THEN 1 ELSE 0 END) AS attended_count,
            e.CreatedAt AS created_at
          FROM Events e
          LEFT JOIN EventCategories ec ON ec.Id = e.CategoryId
          LEFT JOIN Users u ON u.Id = e.OrganizerId
          LEFT JOIN Registrations r ON r.EventId = e.Id
          GROUP BY
            e.Id, e.Title, e.Status, ec.Name, u.Name, u.UserName, e.Location,
            e.StartDate, e.EndDate, e.MinParticipants, e.MaxParticipants,
            e.CurrentParticipants, e.CreatedAt
          ORDER BY e.CreatedAt DESC, e.Id DESC
        SQL
      end

      def donations_sql(limit)
        safe_limit = Integer(limit)
        <<~SQL
          SELECT TOP (#{safe_limit})
            d.Id AS id,
            d.Status AS status,
            d.Amount AS amount,
            d.DisplayName AS display_name,
            d.Email AS email,
            c.Title AS campaign,
            e.Title AS event,
            donor.UserName AS donor_username,
            confirmer.UserName AS confirmed_by,
            d.CreatedAt AS created_at,
            d.ConfirmedAt AS confirmed_at
          FROM IndividualDonations d
          LEFT JOIN SupportCampaigns c ON c.Id = d.CampaignId
          LEFT JOIN Events e ON e.Id = c.EventId
          LEFT JOIN Users donor ON donor.Id = d.UserId
          LEFT JOIN Users confirmer ON confirmer.Id = d.ConfirmedBy
          ORDER BY d.CreatedAt DESC, d.Id DESC
        SQL
      end
    end
  end
end
