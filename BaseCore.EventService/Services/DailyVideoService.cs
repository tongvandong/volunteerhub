using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace BaseCore.EventService.Services
{
    public interface IDailyVideoService
    {
        bool IsConfigured { get; }
        Task<DailyRoomResult> CreateInterviewRoomAsync(int eventId, int registrationId, DateTime scheduledAtUtc, int durationMinutes);
        Task<DailyMeetingTokenResult> CreateMeetingTokenAsync(string roomUrl, int userId, string displayName, bool isOwner, DateTime scheduledAtUtc, int durationMinutes);
    }

    public class DailyVideoService : IDailyVideoService
    {
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        public DailyVideoService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(ApiKey) &&
            !string.IsNullOrWhiteSpace(Domain);

        private string ApiKey =>
            _configuration["Daily:ApiKey"] ??
            Environment.GetEnvironmentVariable("DAILY_API_KEY") ??
            "";

        private string Domain =>
            (_configuration["Daily:Domain"] ??
             Environment.GetEnvironmentVariable("DAILY_DOMAIN") ??
             "").Trim().Replace("https://", "", StringComparison.OrdinalIgnoreCase).Trim('/');

        public async Task<DailyRoomResult> CreateInterviewRoomAsync(int eventId, int registrationId, DateTime scheduledAtUtc, int durationMinutes)
        {
            EnsureConfigured();

            var rawName = $"vh-interview-{eventId}-{registrationId}-{Guid.NewGuid():N}";
            var roomName = rawName.Length > 45 ? rawName[..45] : rawName;
            var startUnix = new DateTimeOffset(scheduledAtUtc.AddMinutes(-10)).ToUnixTimeSeconds();
            var endUnix = new DateTimeOffset(scheduledAtUtc.AddMinutes(Math.Max(durationMinutes, 30) + 30)).ToUnixTimeSeconds();

            var payload = new
            {
                name = roomName,
                privacy = "private",
                properties = new
                {
                    nbf = startUnix,
                    exp = endUnix,
                    eject_at_room_exp = true,
                    enable_knocking = false,
                    max_participants = 2,
                    start_video_off = false,
                    start_audio_off = false,
                    lang = "vi"
                }
            };

            var client = CreateClient();
            var response = await client.PostAsJsonAsync("https://api.daily.co/v1/rooms", payload);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Không tạo được phòng Daily: HTTP {(int)response.StatusCode}: {body}");
            }

            var room = await response.Content.ReadFromJsonAsync<DailyRoomResponse>();
            var url = room?.Url;
            if (string.IsNullOrWhiteSpace(url))
            {
                url = $"https://{Domain}/{roomName}";
            }

            return new DailyRoomResult(roomName, url);
        }

        public async Task<DailyMeetingTokenResult> CreateMeetingTokenAsync(string roomUrl, int userId, string displayName, bool isOwner, DateTime scheduledAtUtc, int durationMinutes)
        {
            EnsureConfigured();

            var roomName = ExtractRoomName(roomUrl);
            if (string.IsNullOrWhiteSpace(roomName))
            {
                throw new InvalidOperationException("Daily room URL không hợp lệ.");
            }

            var startUnix = new DateTimeOffset(scheduledAtUtc.AddMinutes(-15)).ToUnixTimeSeconds();
            var endUnix = new DateTimeOffset(scheduledAtUtc.AddMinutes(Math.Max(durationMinutes, 30) + 45)).ToUnixTimeSeconds();

            var payload = new
            {
                properties = new
                {
                    room_name = roomName,
                    user_id = userId.ToString(),
                    user_name = string.IsNullOrWhiteSpace(displayName) ? $"User {userId}" : displayName,
                    is_owner = isOwner,
                    nbf = startUnix,
                    exp = endUnix,
                    eject_at_token_exp = true
                }
            };

            var client = CreateClient();
            var response = await client.PostAsJsonAsync("https://api.daily.co/v1/meeting-tokens", payload);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Không tạo được Daily meeting token: HTTP {(int)response.StatusCode}: {body}");
            }

            var token = await response.Content.ReadFromJsonAsync<DailyTokenResponse>();
            if (string.IsNullOrWhiteSpace(token?.Token))
            {
                throw new InvalidOperationException("Daily không trả về meeting token.");
            }

            return new DailyMeetingTokenResult(roomName, token.Token);
        }

        private HttpClient CreateClient()
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", ApiKey);
            return client;
        }

        private void EnsureConfigured()
        {
            if (!IsConfigured)
            {
                throw new InvalidOperationException("Daily chưa được cấu hình.");
            }
        }

        private static string ExtractRoomName(string roomUrl)
        {
            if (!Uri.TryCreate(roomUrl, UriKind.Absolute, out var uri))
            {
                return "";
            }

            return uri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? "";
        }
    }

    public record DailyRoomResult(string RoomName, string RoomUrl);
    public record DailyMeetingTokenResult(string RoomName, string Token);

    public class DailyRoomResponse
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("url")]
        public string Url { get; set; } = "";
    }

    public class DailyTokenResponse
    {
        [JsonPropertyName("token")]
        public string Token { get; set; } = "";
    }
}
