using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Services.VolunteerHub;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [ApiController]
    public class CertificatesController : ControllerBase
    {
        private readonly ICertificateService _certificateService;

        public CertificatesController(ICertificateService certificateService)
        {
            _certificateService = certificateService;
        }

        [HttpGet("api/certificates"), Authorize]
        public async Task<IActionResult> GetMyCertificates()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var certs = await _certificateService.GetByUserAsync(userId);
            return Ok(certs);
        }

        [HttpGet("api/certificates/{code}")]
        public async Task<IActionResult> VerifyCertificate(string code)
        {
            var cert = await _certificateService.GetByCodeAsync(code);
            return cert == null ? NotFound(new { message = "Certificate not found" }) : Ok(cert);
        }

        [HttpGet("api/certificates/{code}/pdf")]
        public async Task<IActionResult> DownloadCertificatePdf(string code)
        {
            var cert = await _certificateService.GetByCodeAsync(code);
            if (cert == null) return NotFound(new { message = "Certificate not found" });

            var pdfPath = ResolveGeneratedPdfPath(cert.PdfUrl);
            if (pdfPath != null && System.IO.File.Exists(pdfPath))
            {
                return PhysicalFile(pdfPath, "application/pdf", $"VolunteerHub-{code}.pdf");
            }

            if (string.IsNullOrWhiteSpace(cert.PdfUrl))
            {
                return Accepted(new { message = "Certificate PDF is being generated" });
            }

            var verifyUrl = $"{Request.Scheme}://{Request.Host}/verify/{Uri.EscapeDataString(code)}";
            var pdf = _certificateService.BuildCertificatePdf(cert, verifyUrl);
            return File(pdf, "application/pdf", $"VolunteerHub-{code}.pdf");
        }

        private static string? ResolveGeneratedPdfPath(string? pdfUrl)
        {
            const string prefix = "/certificates/";
            if (string.IsNullOrWhiteSpace(pdfUrl) || !pdfUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var fileName = Path.GetFileName(pdfUrl);
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return null;
            }

            return Path.Combine(AppContext.BaseDirectory, "wwwroot", "certificates", fileName);
        }
    }
}
