using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BaseCore.APIService.Controllers
{
    [Route("api/uploads")]
    [ApiController]
    public class UploadsController : ControllerBase
    {
        private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
        };

        private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp", "image/gif"
        };

        private const long MaxImageBytes = 5 * 1024 * 1024;
        private const long MaxFileBytes = 10 * 1024 * 1024;

        private static readonly HashSet<string> AllowedFileExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".docx", ".doc", ".xlsx", ".jpg", ".jpeg", ".png", ".webp", ".gif"
        };

        [HttpPost("images")]
        [Authorize]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn ảnh để upload." });

            if (file.Length > MaxImageBytes)
                return BadRequest(new { message = "Ảnh không được vượt quá 5MB." });

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedImageExtensions.Contains(extension) || !AllowedImageContentTypes.Contains(file.ContentType))
                return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF." });

            var uploadRoot = GetUploadRoot();
            Directory.CreateDirectory(uploadRoot);

            var fileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var path = Path.Combine(uploadRoot, fileName);

            await using (var stream = System.IO.File.Create(path))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new
            {
                fileName,
                url = Url.Action(nameof(GetImage), new { fileName }) ?? $"/api/uploads/images/{fileName}"
            });
        }

        [HttpGet("images/{fileName}")]
        [AllowAnonymous]
        [EnableRateLimiting("read-sensitive")]
        public IActionResult GetImage(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName) || fileName != Path.GetFileName(fileName))
                return BadRequest(new { message = "Invalid file name" });

            var path = Path.Combine(GetUploadRoot(), fileName);
            if (!System.IO.File.Exists(path))
                return NotFound(new { message = "Image not found" });

            var extension = Path.GetExtension(fileName);
            var contentType = extension.ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };

            return PhysicalFile(path, contentType);
        }

        [HttpPost("file")]
        [Authorize]
        [EnableRateLimiting("write-sensitive")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File trong" });
            if (file.Length > MaxFileBytes)
                return BadRequest(new { message = "File khong duoc vuot qua 10MB" });

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedFileExtensions.Contains(extension))
                return BadRequest(new { message = "Dinh dang file khong ho tro" });

            var uploadRoot = GetFileUploadRoot();
            Directory.CreateDirectory(uploadRoot);

            var fileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var path = Path.Combine(uploadRoot, fileName);

            await using (var stream = System.IO.File.Create(path))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new
            {
                url = Url.Action(nameof(GetFile), new { fileName }) ?? $"/api/uploads/files/{fileName}",
                name = file.FileName,
                size = file.Length,
                type = extension.TrimStart('.').ToLowerInvariant()
            });
        }

        [HttpGet("files/{fileName}")]
        [AllowAnonymous]
        [EnableRateLimiting("read-sensitive")]
        public IActionResult GetFile(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName) || fileName != Path.GetFileName(fileName))
                return BadRequest(new { message = "Invalid file name" });

            var path = Path.Combine(GetFileUploadRoot(), fileName);
            if (!System.IO.File.Exists(path))
                return NotFound(new { message = "File not found" });

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = extension switch
            {
                ".pdf" => "application/pdf",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".doc" => "application/msword",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };

            return PhysicalFile(path, contentType, fileName);
        }

        private static string GetUploadRoot()
        {
            return Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", "images");
        }

        private static string GetFileUploadRoot()
        {
            return Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", "files");
        }
    }
}
