using BaseCore.Entities;
using System.Net;
using System.Net.Mail;

namespace BaseCore.AuthService.Services
{
    public interface IEmailSender
    {
        Task SendPasswordResetAsync(User user, string resetLink);
    }

    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;

        public SmtpEmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendPasswordResetAsync(User user, string resetLink)
        {
            var host = _configuration["Smtp:Host"];
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var fromEmail = _configuration["Smtp:FromEmail"];
            var fromName = _configuration["Smtp:FromName"] ?? "VolunteerHub";
            var port = int.TryParse(_configuration["Smtp:Port"], out var parsedPort) ? parsedPort : 587;
            var enableSsl = !bool.TryParse(_configuration["Smtp:EnableSsl"], out var parsedSsl) || parsedSsl;

            if (string.IsNullOrWhiteSpace(host) ||
                string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password) ||
                string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("SMTP chưa được cấu hình đầy đủ.");
            }

            if (string.IsNullOrWhiteSpace(user.Email))
            {
                throw new InvalidOperationException("Tài khoản chưa có email để nhận liên kết đặt lại mật khẩu.");
            }

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(username, password)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = "Đặt lại mật khẩu VolunteerHub",
                IsBodyHtml = true,
                Body = BuildPasswordResetEmail(user.Name, resetLink)
            };

            message.To.Add(new MailAddress(user.Email, string.IsNullOrWhiteSpace(user.Name) ? user.UserName : user.Name));
            await client.SendMailAsync(message);
        }

        private static string BuildPasswordResetEmail(string? displayName, string resetLink)
        {
            var name = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(displayName) ? "bạn" : displayName);
            var link = WebUtility.HtmlEncode(resetLink);

            return $@"
<!doctype html>
<html lang=""vi"">
<body style=""font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;color:#172033"">
  <div style=""max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px"">
    <h2 style=""margin:0 0 12px;color:#1552b0"">Đặt lại mật khẩu VolunteerHub</h2>
    <p>Xin chào {name},</p>
    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tạo mật khẩu mới.</p>
    <p style=""margin:24px 0"">
      <a href=""{link}"" style=""background:#1b61c9;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700"">Đặt lại mật khẩu</a>
    </p>
    <p>Liên kết này có hiệu lực trong 30 phút và sẽ tự vô hiệu sau khi bạn đổi mật khẩu.</p>
    <p style=""font-size:13px;color:#667085"">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
  </div>
</body>
</html>";
        }
    }
}
