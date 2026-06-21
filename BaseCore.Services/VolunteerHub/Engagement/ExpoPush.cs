using System.Net.Http;
using System.Text;
using Newtonsoft.Json;

namespace BaseCore.Services.VolunteerHub
{
    // Gửi thông báo đẩy qua Expo Push API (https://docs.expo.dev/push-notifications/sending-notifications/).
    // Best-effort: lỗi gửi push KHÔNG được làm hỏng luồng nghiệp vụ chính.
    public static class ExpoPush
    {
        private static readonly HttpClient Http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        private const string Endpoint = "https://exp.host/--/api/v2/push/send";

        public static async Task SendAsync(IEnumerable<string> tokens, string title, string body, object? data = null)
        {
            try
            {
                var messages = tokens
                    .Where(t => !string.IsNullOrWhiteSpace(t) && t.StartsWith("ExponentPushToken"))
                    .Select(t => new
                    {
                        to = t,
                        title,
                        body,
                        sound = "default",
                        data = data ?? new { },
                    })
                    .ToList();

                if (messages.Count == 0) return;

                var json = JsonConvert.SerializeObject(messages);
                using var content = new StringContent(json, Encoding.UTF8, "application/json");
                using var req = new HttpRequestMessage(HttpMethod.Post, Endpoint) { Content = content };
                req.Headers.Add("Accept", "application/json");
                await Http.SendAsync(req);
            }
            catch
            {
                // nuốt lỗi: push là phụ trợ
            }
        }
    }
}
