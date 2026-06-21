using System;

namespace BaseCore.Entities
{
    // Token thiết bị (Expo push token) để gửi thông báo đẩy cho người dùng.
    public class PushDeviceToken
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Token { get; set; } = "";       // ExponentPushToken[...]
        public string Platform { get; set; } = "";     // android | ios
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; }
    }
}
