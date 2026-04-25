using BaseCore.Common;
using BaseCore.Entities;
using BaseCore.Services.Authen;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BaseCore.AuthService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly IConfiguration _configuration;
        private const int TokenExpirationMinutes = 480;

        public AuthController(
            IUserService userService,
            IRefreshTokenService refreshTokenService,
            IConfiguration configuration)
        {
            _userService = userService;
            _refreshTokenService = refreshTokenService;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Username/email and password are required" });
            }

            var identifier = request.Username ?? request.Email;
            if (string.IsNullOrWhiteSpace(identifier))
            {
                return BadRequest(new { message = "Username/email and password are required" });
            }

            var user = await _userService.AuthenticateByUsernameOrEmail(identifier, request.Password);
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid username/email or password" });
            }

            return Ok(await CreateAuthResponseAsync(user));
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid request" });
            }

            var username = ResolveUsername(request);
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Username/email and password are required" });
            }

            if (request.Password.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters" });
            }

            var userType = ResolveUserType(request);
            var displayName = ResolveDisplayName(request, username);

            try
            {
                var user = new User
                {
                    UserName = username,
                    Name = displayName,
                    Email = request.Email ?? "",
                    Phone = request.Phone ?? "",
                    UserType = userType
                };

                var createdUser = await _userService.Create(user, request.Password);

                return Ok(new
                {
                    message = "Registration successful",
                    user = MapUserResponse(createdUser)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Registration failed: " + ex.Message });
            }
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
                return NotFound(new { message = "User not found" });
            }

            return Ok(MapUserResponse(user));
        }

        [HttpPost("refresh")]
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
                return BadRequest(new { message = "New password and confirm password do not match" });
            }

            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userService.GetById(userId);
            if (user == null || !user.IsActive)
            {
                return NotFound(new { message = "User not found" });
            }

            var verified = await _userService.AuthenticateByUsernameOrEmail(user.UserName, request.CurrentPassword);
            if (verified == null)
            {
                return BadRequest(new { message = "Current password is incorrect" });
            }

            await _userService.Update(user, request.NewPassword);
            return Ok(new { message = "Password changed successfully" });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest? request)
        {
            if (!string.IsNullOrWhiteSpace(request?.RefreshToken))
            {
                await _refreshTokenService.RevokeAsync(request.RefreshToken);
            }

            return Ok(new { message = "Logout successful" });
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

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = "";
        public string NewPassword { get; set; } = "";
        public string? ConfirmNewPassword { get; set; }
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = "";
    }
}
