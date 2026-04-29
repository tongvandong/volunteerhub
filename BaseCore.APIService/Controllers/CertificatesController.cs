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

            var verifyUrl = $"{Request.Scheme}://{Request.Host}/verify/{Uri.EscapeDataString(code)}";
            var pdf = _certificateService.BuildCertificatePdf(cert, verifyUrl);
            return File(pdf, "application/pdf", $"VolunteerHub-{code}.pdf");
        }
    }
}
