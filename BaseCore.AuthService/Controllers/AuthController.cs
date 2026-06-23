using BaseCore.Common;
using BaseCore.AuthService.Services;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Services.Authen;
using BaseCore.Services.VolunteerHub;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;

namespace BaseCore.AuthService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly IEmailSender _emailSender;
        private readonly IAuditLogService _auditLogService;
        private readonly IConfiguration _configuration;
        private readonly MySqlDbContext _context;
        private const int TokenExpirationMinutes = 480;
        private const int RegistrationCodeExpirationMinutes = 10;
        private const int MaxRegistrationCodeAttempts = 5;

        public AuthController(
            IUserService userService,
            IRefreshTokenService refreshTokenService,
            IEmailSender emailSender,
            IAuditLogService auditLogService,
            IConfiguration configuration,
            MySqlDbContext context)
        {
            _userService = userService;
            _refreshTokenService = refreshTokenService;
            _emailSender = emailSender;
            _auditLogService = auditLogService;
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth-sensitive")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Tên đăng nhập/email và mật khẩu là bắt buộc." });
            }

            var identifier = request.Username ?? request.Email;
            if (string.IsNullOrWhiteSpace(identifier))
            {
                return BadRequest(new { message = "Tên đăng nhập/email và mật khẩu là bắt buộc." });
            }

            var user = await _userService.AuthenticateByUsernameOrEmail(identifier, request.Password);
            if (user == null)
            {
                await RecordAuditAsync(null, "Auth.LoginFailed", "User", null, $"Identifier={MaskIdentifier(identifier)}");
                return Unauthorized(new { message = "Tên đăng nhập/email hoặc mật khẩu không đúng." });
            }

            var response = await CreateAuthResponseAsync(user);
            await RecordAuditAsync(user.Id, "Auth.Login", "User", user.Id);
            return Ok(response);
        }

        [HttpPost("register")]
        [EnableRateLimiting("auth-sensitive")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Dữ liệu đăng ký không hợp lệ." });
            }

            var username = ResolveUsername(request);
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Tên đăng nhập và mật khẩu là bắt buộc." });
            }

            var validation = await ValidateRegisterRequestAsync(request, username);
            if (validation != null)
            {
                return BadRequest(new { message = validation });
            }

            var userType = ResolveUserType(request);
            var displayName = ResolveDisplayName(request, username);
            var email = request.Email?.Trim() ?? "";
            var phone = request.Phone?.Trim() ?? "";

            try
            {
                var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
                var passwordHash = TokenHelper.HashPassword(request.Password, out var salt);
                var normalizedUsername = username.Trim();
                var normalizedEmail = email.ToLowerInvariant();

                var existingPendings = await _context.PendingRegistrations
                    .Where(p => p.UserName == normalizedUsername || p.Email == normalizedEmail)
                    .ToListAsync();
                if (existingPendings.Count > 0)
                {
                    _context.PendingRegistrations.RemoveRange(existingPendings);
                }

                var pending = new PendingRegistration
                {
                    UserName = normalizedUsername,
                    Name = displayName,
                    Email = normalizedEmail,
                    Phone = phone,
                    UserType = userType,
                    Password = passwordHash,
                    Salt = salt,
                    CodeHash = HashRegistrationCode(code, normalizedEmail, normalizedUsername),
                    Attempts = 0,
                    CreatedAtUtc = DateTime.UtcNow,
                    LastSentAtUtc = DateTime.UtcNow,
                    ExpiresAtUtc = DateTime.UtcNow.AddMinutes(RegistrationCodeExpirationMinutes)
                };

                _context.PendingRegistrations.Add(pending);
                await _context.SaveChangesAsync();

                await _emailSender.SendRegistrationCodeAsync(normalizedEmail, displayName, code);
                await RecordAuditAsync(null, "Auth.RegisterCodeSent", "PendingRegistration", pending.Id, $"Role={MapRole(userType)};Email={MaskEmail(normalizedEmail)}");

                return Ok(new
                {
                    message = $"Đã gửi mã xác minh 6 số đến {MaskEmail(normalizedEmail)}. Vui lòng kiểm tra hộp thư đến hoặc thư rác.",
                    requiresEmailVerification = true,
                    email = MaskEmail(normalizedEmail),
                    expiresInMinutes = RegistrationCodeExpirationMinutes
                });
            }
            catch (Exception ex)
            {
                await RecordAuditAsync(null, "Auth.RegisterCodeFailed", "PendingRegistration", null, ex.Message);
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Chưa gửi được mã xác minh đăng ký. Vui lòng kiểm tra cấu hình SMTP."
                });
            }
        }

        [HttpPost("verify-registration")]
        [EnableRateLimiting("auth-sensitive")]
        public async Task<IActionResult> VerifyRegistration([FromBody] VerifyRegistrationRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Tên đăng nhập, email và mã xác minh là bắt buộc." });
            }

            var username = request.Username.Trim();
            var email = request.Email.Trim().ToLowerInvariant();
            var code = request.Code.Trim();

            if (!Regex.IsMatch(code, @"^\d{6}$"))
            {
                return BadRequest(new { message = "Mã xác minh phải gồm đúng 6 chữ số." });
            }

            var pending = await _context.PendingRegistrations
                .FirstOrDefaultAsync(p => p.UserName == username && p.Email == email);

            if (pending == null || pending.ExpiresAtUtc < DateTime.UtcNow)
            {
                if (pending != null)
                {
                    _context.PendingRegistrations.Remove(pending);
                    await _context.SaveChangesAsync();
                }

                return BadRequest(new { message = "Mã đăng ký không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại để nhận mã mới." });
            }

            if (pending.Attempts >= MaxRegistrationCodeAttempts)
            {
                _context.PendingRegistrations.Remove(pending);
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Bạn đã nhập sai mã quá nhiều lần. Vui lòng đăng ký lại để nhận mã mới." });
            }

            var expectedHash = HashRegistrationCode(code, pending.Email, pending.UserName);
            if (!FixedTimeEquals(expectedHash, pending.CodeHash))
            {
                pending.Attempts++;
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Mã xác minh không đúng." });
            }

            if (await _context.Users.AnyAsync(u => u.UserName == pending.UserName))
            {
                _context.PendingRegistrations.Remove(pending);
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Tên đăng nhập đã tồn tại. Vui lòng đăng ký lại bằng tên khác." });
            }

            if (await _context.Users.AnyAsync(u => u.Email == pending.Email))
            {
                _context.PendingRegistrations.Remove(pending);
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Email đã tồn tại. Vui lòng đăng nhập hoặc dùng email khác." });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            var user = new User
            {
                UserName = pending.UserName,
                Name = pending.Name,
                Email = pending.Email,
                Phone = pending.Phone,
                UserType = pending.UserType,
                Password = pending.Password,
                Salt = pending.Salt,
                IsActive = true,
                Created = DateTime.Now,
                Position = MapRole(pending.UserType),
                Contact = "",
                Image = ""
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            AddDefaultProfileForRegisteredUser(user);
            _context.PendingRegistrations.Remove(pending);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            await RecordAuditAsync(user.Id, "Auth.RegisterVerified", "User", user.Id, $"Role={MapRole(user.UserType)}");
            return Ok(new
            {
                message = "Xác minh email thành công. Bạn có thể đăng nhập.",
                user = MapUserResponse(user)
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userService.GetById(userId);
            if (user == null || !user.IsActive)
            {
                return NotFound(new { message = "Email hoặc tên đăng nhập không tồn tại trong hệ thống." });
            }

            return Ok(MapUserResponse(user));
        }

        [HttpPost("refresh")]
        [EnableRateLimiting("auth-sensitive")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(new { message = "Refresh token is required" });
            }

            var currentToken = await _refreshTokenService.GetActiveTokenAsync(request.RefreshToken);
            if (currentToken == null || !currentToken.User.IsActive)
            {
                return Unauthorized(new { message = "Refresh token is invalid or expired" });
            }

            var user = await _userService.GetById(currentToken.UserId);
            if (user == null || !user.IsActive)
            {
                return Unauthorized(new { message = "User is no longer active" });
            }

            return Ok(await CreateAuthResponseAsync(user, currentToken));
        }

        [HttpPost("change-password")]
        [Authorize]
        [EnableRateLimiting("auth-sensitive")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Current password and new password are required" });
            }

            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new { message = "New password must be at least 8 characters" });
            }

            if (!string.IsNullOrWhiteSpace(request.ConfirmNewPassword) &&
                request.NewPassword != request.ConfirmNewPassword)
            {
                return BadRequest(new { message = "Mật khẩu xác nhận không khớp." });
            }

            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userService.GetById(userId);
            if (user == null || !user.IsActive)
            {
                return NotFound(new { message = "Email hoặc tên đăng nhập không tồn tại trong hệ thống." });
            }

            var verified = await _userService.AuthenticateByUsernameOrEmail(user.UserName, request.CurrentPassword);
            if (verified == null)
            {
                return BadRequest(new { message = "Current password is incorrect" });
            }

            await _userService.Update(user, request.NewPassword);
            await RecordAuditAsync(user.Id, "Auth.ChangePassword", "User", user.Id);
            return Ok(new { message = "Password changed successfully" });
        }

        [HttpPost("forgot-password")]
        [EnableRateLimiting("auth-sensitive")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Identifier))
            {
                return BadRequest(new { message = "Vui lòng nhập email hoặc tên đăng nhập." });
            }

            var identifier = request.Identifier.Trim();
            var user = (await _userService.GetAll()).FirstOrDefault(u =>
                string.Equals(u.UserName, identifier, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(u.Email, identifier, StringComparison.OrdinalIgnoreCase));

            if (user == null || !user.IsActive)
            {
                await RecordAuditAsync(null, "Auth.ForgotPassword", "User", null, $"Identifier={MaskIdentifier(identifier)};Result=NotFound");
                return NotFound(new { message = "Email hoặc tên đăng nhập không tồn tại trong hệ thống." });
            }

            try
            {
                var resetToken = GeneratePasswordResetToken(user);
                var resetLink = BuildPasswordResetLink(resetToken);
                await _emailSender.SendPasswordResetAsync(user, resetLink);
                await RecordAuditAsync(user.Id, "Auth.ForgotPassword", "User", user.Id);
            }
            catch (Exception ex)
            {
                await RecordAuditAsync(user.Id, "Auth.ForgotPasswordFailed", "User", user.Id, ex.Message);
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    message = "Chưa gửi được email đặt lại mật khẩu. Vui lòng kiểm tra cấu hình SMTP."
                });
            }

            var destination = string.IsNullOrWhiteSpace(user.Email) ? "email của tài khoản" : MaskEmail(user.Email);
            return Ok(new { message = $"Đã gửi liên kết đặt lại mật khẩu đến {destination}. Vui lòng kiểm tra hộp thư đến hoặc thư rác." });
        }

        [HttpPost("reset-password")]
        [EnableRateLimiting("auth-sensitive")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.Token) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Token và mật khẩu mới là bắt buộc." });
            }

            if (!string.IsNullOrWhiteSpace(request.ConfirmNewPassword) &&
                request.NewPassword != request.ConfirmNewPassword)
            {
                return BadRequest(new { message = "Mật khẩu xác nhận không khớp." });
            }

            var passwordValidation = ValidatePassword(request.NewPassword);
            if (passwordValidation != null)
            {
                return BadRequest(new { message = passwordValidation });
            }

            var user = await ValidatePasswordResetTokenAsync(request.Token);
            if (user == null)
            {
                return BadRequest(new { message = "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
            }

            await _userService.Update(user, request.NewPassword);

            await _refreshTokenService.RevokeAllForUserAsync(user.Id);

            await RecordAuditAsync(user.Id, "Auth.ResetPassword", "User", user.Id);
            return Ok(new { message = "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới." });
        }

        [HttpPost("logout")]
        [Authorize]
        [EnableRateLimiting("auth-sensitive")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest? request)
        {
            if (!string.IsNullOrWhiteSpace(request?.RefreshToken))
            {
                await _refreshTokenService.RevokeAsync(request.RefreshToken);
            }

            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId = int.TryParse(userIdValue, out var parsedUserId) ? parsedUserId : (int?)null;
            await RecordAuditAsync(userId, "Auth.Logout", "User", userId);
            return Ok(new { message = "Logout successful" });
        }

        private Task RecordAuditAsync(int? userId, string action, string entityType, int? entityId = null, string? metadata = null)
        {
            return _auditLogService.RecordAsync(
                userId,
                action,
                entityType,
                entityId,
                metadata,
                HttpContext.Connection.RemoteIpAddress?.ToString());
        }

        private static string MaskIdentifier(string identifier)
        {
            var trimmed = identifier.Trim();
            if (trimmed.Length <= 3) return "***";
            if (trimmed.Contains('@'))
            {
                var parts = trimmed.Split('@', 2);
                return $"{parts[0][0]}***@{parts[1]}";
            }

            return $"{trimmed[..2]}***{trimmed[^1]}";
        }

        private static string MaskEmail(string email)
        {
            var trimmed = email.Trim();
            var parts = trimmed.Split('@', 2);
            if (parts.Length != 2 || parts[0].Length == 0)
            {
                return MaskIdentifier(trimmed);
            }

            var local = parts[0].Length <= 2
                ? $"{parts[0][0]}***"
                : $"{parts[0][0]}***{parts[0][^1]}";
            return $"{local}@{parts[1]}";
        }

        private async Task<object> CreateAuthResponseAsync(User user, AuthRefreshToken? currentRefreshToken = null)
        {
            var role = MapRole(user.UserType);
            var secretKey = _configuration["Jwt:SecretKey"] ?? "YourSecretKeyForAuthenticationShouldBeLongEnough";
            var token = TokenHelper.GenerateToken(
                secretKey,
                TokenExpirationMinutes,
                user.Id.ToString(),
                user.UserName,
                role);

            var refreshResult = currentRefreshToken == null
                ? await _refreshTokenService.IssueAsync(user.Id)
                : await _refreshTokenService.RotateAsync(currentRefreshToken);

            return new
            {
                token,
                accessToken = token,
                refreshToken = refreshResult.PlainToken,
                expiresIn = TokenExpirationMinutes * 60,
                user = MapUserResponse(user)
            };
        }

        private static object MapUserResponse(User user)
        {
            var role = MapRole(user.UserType);

            return new
            {
                id = user.Id,
                userName = user.UserName,
                name = user.Name,
                fullName = user.Name,
                email = user.Email,
                phone = user.Phone,
                userType = user.UserType,
                role,
                roles = new[] { role },
                isActive = user.IsActive,
                created = user.Created
            };
        }

        private static string MapRole(int userType)
        {
            return userType switch
            {
                3 => "Admin",
                1 => "Organizer",
                2 => "Sponsor",
                _ => "Volunteer"
            };
        }

        private static string ResolveUsername(RegisterRequest request)
        {
            if (!string.IsNullOrWhiteSpace(request.Username))
            {
                return request.Username.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                return request.Email.Trim();
            }

            return string.Empty;
        }

        private static string ResolveDisplayName(RegisterRequest request, string fallback)
        {
            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                return request.Name.Trim();
            }

            var firstName = request.FirstName?.Trim();
            var lastName = request.LastName?.Trim();
            var combined = string.Join(" ", new[] { firstName, lastName }.Where(x => !string.IsNullOrWhiteSpace(x)));

            return string.IsNullOrWhiteSpace(combined) ? fallback : combined;
        }

        private static int ResolveUserType(RegisterRequest request)
        {
            if (request.UserType.HasValue)
            {
                return request.UserType.Value;
            }

            return string.Equals(request.Role, "Organizer", StringComparison.OrdinalIgnoreCase) ? 1
                : string.Equals(request.Role, "Sponsor", StringComparison.OrdinalIgnoreCase) ? 2
                : 0;
        }

        private async Task<string?> ValidateRegisterRequestAsync(RegisterRequest request, string username)
        {
            if (username.Length < 3 || username.Length > 50)
                return "Tên đăng nhập phải dài từ 3 đến 50 ký tự.";
            if (!Regex.IsMatch(username, "^[a-zA-Z0-9_-]+$"))
                return "Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang.";

            if (request.Password.Length < 8)
                return "Mật khẩu phải có ít nhất 8 ký tự.";
            if (!Regex.IsMatch(request.Password, "[A-Za-z]") || !Regex.IsMatch(request.Password, "[0-9]"))
                return "Mật khẩu phải có ít nhất một chữ cái và một chữ số.";

            var userType = ResolveUserType(request);
            if (userType is < 0 or > 2)
                return "Đăng ký công khai chỉ hỗ trợ Tình nguyện viên, Nhà tổ chức hoặc Nhà tài trợ.";

            if (!string.IsNullOrWhiteSpace(request.Role) &&
                !new[] { "Volunteer", "Organizer", "Sponsor" }.Contains(request.Role.Trim(), StringComparer.OrdinalIgnoreCase))
                return "Vai trò đăng ký không hợp lệ.";

            if (string.IsNullOrWhiteSpace(request.Email))
                return "Email là bắt buộc để nhận mã xác minh đăng ký.";

            if (request.Email.Length > 100 || !IsValidEmail(request.Email.Trim()))
                return "Email không hợp lệ.";

            var allUsers = await _userService.GetAll();
            var trimmedEmail = request.Email.Trim();
            if (allUsers.Any(u => string.Equals(u.Email, trimmedEmail, StringComparison.OrdinalIgnoreCase)))
                return "Email đã tồn tại.";

            if (allUsers.Any(u => string.Equals(u.UserName, username, StringComparison.OrdinalIgnoreCase)))
                return "Tên đăng nhập đã tồn tại.";

            if (!string.IsNullOrWhiteSpace(request.Phone) &&
                (request.Phone.Trim().Length > 20 || !Regex.IsMatch(request.Phone.Trim(), @"^\+?[0-9\s.-]{8,20}$")))
                return "Số điện thoại không hợp lệ.";

            return null;
        }
        private static bool IsValidEmail(string email)
        {
            try
            {
                var address = new MailAddress(email);
                return string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        private string GeneratePasswordResetToken(User user)
        {
            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(30).ToUnixTimeSeconds();
            var payload = $"{user.Id}:{expiresAt}:{Guid.NewGuid():N}";
            var signature = SignPasswordResetPayload(payload, user);
            return $"{Base64UrlEncode(payload)}.{signature}";
        }

        private string BuildPasswordResetLink(string resetToken)
        {
            var frontendBaseUrl = _configuration["Frontend:BaseUrl"];
            if (string.IsNullOrWhiteSpace(frontendBaseUrl))
            {
                frontendBaseUrl = Request.Headers.Origin.FirstOrDefault();
            }
            if (string.IsNullOrWhiteSpace(frontendBaseUrl))
            {
                frontendBaseUrl = $"{Request.Scheme}://{Request.Host}";
            }

            return $"{frontendBaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(resetToken)}";
        }

        private async Task<User?> ValidatePasswordResetTokenAsync(string token)
        {
            var parts = token.Split('.', 2);
            if (parts.Length != 2)
            {
                return null;
            }

            string payload;
            try
            {
                payload = Base64UrlDecode(parts[0]);
            }
            catch
            {
                return null;
            }

            var fields = payload.Split(':');
            if (fields.Length != 3 ||
                !int.TryParse(fields[0], out var userId) ||
                !long.TryParse(fields[1], out var expiresAt) ||
                DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expiresAt)
            {
                return null;
            }

            var user = await _userService.GetById(userId);
            if (user == null || !user.IsActive)
            {
                return null;
            }

            var expectedSignature = SignPasswordResetPayload(payload, user);
            return FixedTimeEquals(parts[1], expectedSignature) ? user : null;
        }

        private string SignPasswordResetPayload(string payload, User user)
        {
            var secretKey = _configuration["Jwt:SecretKey"] ?? "YourSecretKeyForAuthenticationShouldBeLongEnough";
            var material = $"{secretKey}:{user.Password}:{Convert.ToBase64String(user.Salt ?? Array.Empty<byte>())}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(material));
            return Base64UrlEncode(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));
        }

        private string HashRegistrationCode(string code, string email, string username)
        {
            var secretKey = _configuration["Jwt:SecretKey"] ?? "YourSecretKeyForAuthenticationShouldBeLongEnough";
            var material = $"{secretKey}:{email.Trim().ToLowerInvariant()}:{username.Trim()}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(material));
            return Base64UrlEncode(hmac.ComputeHash(Encoding.UTF8.GetBytes(code)));
        }

        private void AddDefaultProfileForRegisteredUser(User user)
        {
            if (user.UserType == 0)
            {
                _context.VolunteerProfiles.Add(new VolunteerProfile
                {
                    UserId = user.Id,
                    BloodType = "",
                    Interests = "",
                    Bio = "",
                    AvatarUrl = "",
                    KycStatus = "Unverified",
                    IdentityFrontImageUrl = "",
                    IdentityBackImageUrl = "",
                    PortraitImageUrl = "",
                    KycAdminNote = ""
                });
                return;
            }

            if (user.UserType == 1)
            {
                _context.OrganizerVerifications.Add(new OrganizerVerification
                {
                    OrganizerId = user.Id,
                    OrganizationName = "",
                    RepresentativeName = user.Name ?? "",
                    ContactEmail = user.Email ?? "",
                    Phone = user.Phone ?? "",
                    Status = "Unverified",
                    CreatedAt = DateTime.UtcNow,
                    SubmittedAt = DateTime.UtcNow
                });
                return;
            }

            if (user.UserType == 2)
            {
                _context.SponsorProfiles.Add(new SponsorProfile
                {
                    UserId = user.Id,
                    OrganizationName = "",
                    RepresentativeName = user.Name ?? "",
                    ContactEmail = user.Email ?? "",
                    Phone = user.Phone ?? "",
                    IsVerified = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        private static string Base64UrlEncode(string value)
        {
            return Base64UrlEncode(Encoding.UTF8.GetBytes(value));
        }

        private static string Base64UrlEncode(byte[] bytes)
        {
            return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }

        private static string Base64UrlDecode(string value)
        {
            var padded = value.Replace('-', '+').Replace('_', '/');
            padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
            return Encoding.UTF8.GetString(Convert.FromBase64String(padded));
        }

        private static bool FixedTimeEquals(string left, string right)
        {
            var leftBytes = Encoding.UTF8.GetBytes(left);
            var rightBytes = Encoding.UTF8.GetBytes(right);
            return leftBytes.Length == rightBytes.Length &&
                CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
        }

        private static string? ValidatePassword(string password)
        {
            if (password.Length < 8)
                return "Mật khẩu phải có ít nhất 8 ký tự.";
            if (!Regex.IsMatch(password, "[A-Za-z]") || !Regex.IsMatch(password, "[0-9]"))
                return "Mật khẩu phải có ít nhất một chữ cái và một chữ số.";
            return null;
        }
    }

    public class LoginRequest
    {
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string Password { get; set; } = "";
    }

    public class RegisterRequest
    {
        public string? Username { get; set; }
        public string? Name { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Password { get; set; } = "";
        public int? UserType { get; set; }
        public string? Role { get; set; }
    }

    public class VerifyRegistrationRequest
    {
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string Code { get; set; } = "";
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = "";
        public string NewPassword { get; set; } = "";
        public string? ConfirmNewPassword { get; set; }
    }

    public class ForgotPasswordRequest
    {
        public string Identifier { get; set; } = "";
    }

    public class ResetPasswordRequest
    {
        public string Token { get; set; } = "";
        public string NewPassword { get; set; } = "";
        public string? ConfirmNewPassword { get; set; }
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = "";
    }
}


