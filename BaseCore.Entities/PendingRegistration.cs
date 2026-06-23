using System;
using System.Text.Json.Serialization;

namespace BaseCore.Entities
{
    public class PendingRegistration
    {
        public int Id { get; set; }
        public string UserName { get; set; } = "";
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Phone { get; set; } = "";
        public int UserType { get; set; }
        [JsonIgnore]
        public string Password { get; set; } = "";
        [JsonIgnore]
        public byte[] Salt { get; set; } = Array.Empty<byte>();
        [JsonIgnore]
        public string CodeHash { get; set; } = "";
        public int Attempts { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime LastSentAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAtUtc { get; set; }
    }
}
