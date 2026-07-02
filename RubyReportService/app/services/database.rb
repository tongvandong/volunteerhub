require "tiny_tds"

module VolunteerHub
  module ReportService
    class Database
      class << self
        def with_client
          client = TinyTds::Client.new(connection_options)
          yield client
        ensure
          client&.close
        end

        def check!
          with_client do |client|
            client.execute("SELECT 1 AS ok").each.first
          end
        end

        private

        def connection_options
          config = parse_connection_string(
            ENV["REPORT_DATABASE_URL"] || ENV["DATABASE_URL"] || default_connection_string
          )

          server = config.fetch("server", "localhost")
          host, port = split_server(server)

          {
            username: config.fetch("user id", config.fetch("uid", "sa")),
            password: config.fetch("password", ""),
            host: host,
            port: Integer(port || config.fetch("port", 1433)),
            database: config.fetch("database", "VolunteerHub"),
            tds_version: ENV.fetch("TDS_VERSION", "7.4"),
            login_timeout: Integer(ENV.fetch("DB_LOGIN_TIMEOUT", 5)),
            timeout: Integer(ENV.fetch("DB_TIMEOUT", 15))
          }
        end

        def default_connection_string
          "Server=localhost,1433;Database=VolunteerHub;User Id=sa;Password="
        end

        def parse_connection_string(value)
          value
            .to_s
            .split(";")
            .filter_map do |part|
              key, raw = part.split("=", 2)
              next if key.nil? || raw.nil?

              [key.strip.downcase, raw.strip]
            end
            .to_h
        end

        def split_server(server)
          return [server, nil] unless server.include?(",")

          host, port = server.split(",", 2)
          [host, port]
        end
      end
    end
  end
end
