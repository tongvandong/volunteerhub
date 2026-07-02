require "jwt"

module VolunteerHub
  module ReportService
    class Unauthorized < StandardError; end
    class Forbidden < StandardError; end

    class Authenticator
      ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      DEFAULT_SECRET = "YourSecretKeyForAuthenticationShouldBeLongEnough"

      def initialize(authorization_header)
        @authorization_header = authorization_header.to_s
      end

      def authenticate_admin!
        payload = decode_token
        roles = extract_roles(payload)

        return payload if roles.any? { |role| role.casecmp("Admin").zero? }

        raise Forbidden, "Admin role is required"
      end

      private

      def decode_token
        token = bearer_token
        raise Unauthorized, "Bearer token is missing" if token.empty?

        JWT.decode(token, jwt_secret, true, algorithm: "HS256").first
      rescue JWT::ExpiredSignature
        raise Unauthorized, "Bearer token has expired"
      rescue JWT::DecodeError => e
        raise Unauthorized, "Bearer token is invalid: #{e.message}"
      end

      def bearer_token
        match = @authorization_header.match(/\ABearer\s+(.+)\z/i)
        match ? match[1].strip : ""
      end

      def jwt_secret
        ENV["JWT_SECRET"] || ENV["Jwt__SecretKey"] || DEFAULT_SECRET
      end

      def extract_roles(payload)
        values = [
          payload["role"],
          payload["roles"],
          payload[ROLE_CLAIM]
        ].flatten.compact

        values.flat_map { |value| value.to_s.split(/[,\s]+/) }.reject(&:empty?)
      end
    end
  end
end
