using System.Security.Claims;
using BaseCore.EventService.Graph;
using BaseCore.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.EventService.Controllers
{
    [ApiController]
    [Route("api/recommendations")]
    public class RecommendationController : ControllerBase
    {
        private readonly GraphSyncService _graph;
        private readonly MySqlDbContext _db;

        public RecommendationController(GraphSyncService graph, MySqlDbContext db)
        {
            _graph = graph;
            _db = db;
        }

        private static int Clamp(int limit) => limit < 1 ? 1 : (limit > 50 ? 50 : limit);

        /// <summary>Sự kiện gợi ý cho chính tình nguyện viên đang đăng nhập.</summary>
        [HttpGet("events"), Authorize]
        public async Task<IActionResult> EventsForMe([FromQuery] int limit = 5)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                return Unauthorized();
            var items = await _graph.RecommendEventsForVolunteerAsync(userId, Clamp(limit));
            return Ok(new { items, degraded = !_graph.Enabled });
        }

        /// <summary>Tình nguyện viên phù hợp cho một sự kiện (organizer sở hữu hoặc admin).</summary>
        [HttpGet("events/{eventId:int}/volunteers"), Authorize(Roles = "Organizer,Admin")]
        public async Task<IActionResult> VolunteersForEvent(int eventId, [FromQuery] int limit = 10)
        {
            var ownership = await EnsureEventOwnerAsync(eventId);
            if (ownership != null) return ownership;
            var items = await _graph.RecommendVolunteersForEventAsync(eventId, Clamp(limit));
            return Ok(new { items, degraded = !_graph.Enabled });
        }

        /// <summary>Nhà tài trợ tiềm năng cho một sự kiện theo lĩnh vực từng tài trợ.</summary>
        [HttpGet("events/{eventId:int}/sponsors"), Authorize(Roles = "Organizer,Admin")]
        public async Task<IActionResult> SponsorsForEvent(int eventId, [FromQuery] int limit = 10)
        {
            var ownership = await EnsureEventOwnerAsync(eventId);
            if (ownership != null) return ownership;
            var items = await _graph.RecommendSponsorsForEventAsync(eventId, Clamp(limit));
            return Ok(new { items, degraded = !_graph.Enabled });
        }

        /// <summary>Tình nguyện viên hay tham gia cùng (đồng tham gia).</summary>
        [HttpGet("volunteers/{userId:int}/similar"), Authorize]
        public async Task<IActionResult> SimilarVolunteers(int userId, [FromQuery] int limit = 10)
        {
            // Volunteer chỉ xem của chính mình; Admin xem bất kỳ.
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin)
            {
                if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var me) || me != userId)
                    return Forbid();
            }
            var items = await _graph.SimilarVolunteersAsync(userId, Clamp(limit));
            return Ok(new { items, degraded = !_graph.Enabled });
        }

        // Trả null nếu hợp lệ; ngược lại trả ActionResult lỗi tương ứng.
        private async Task<IActionResult?> EnsureEventOwnerAsync(int eventId)
        {
            var ev = await _db.Events.AsNoTracking()
                .Where(e => e.Id == eventId)
                .Select(e => new { e.OrganizerId })
                .FirstOrDefaultAsync();
            if (ev == null) return NotFound(new { message = "Event not found" });

            if (User.IsInRole("Admin")) return null;
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId) || userId != ev.OrganizerId)
                return Forbid();
            return null;
        }
    }

    [ApiController]
    [Route("api/admin/graph")]
    [Authorize(Roles = "Admin")]
    public class GraphAdminController : ControllerBase
    {
        private readonly GraphSyncService _graph;
        public GraphAdminController(GraphSyncService graph) => _graph = graph;

        /// <summary>Ép đồng bộ lại toàn bộ graph từ SQL.</summary>
        [HttpPost("rebuild")]
        public async Task<IActionResult> Rebuild(CancellationToken ct)
        {
            if (!_graph.Enabled) return Ok(new { enabled = false, message = "Neo4j not configured" });
            await _graph.EnsureSchemaAsync(ct);
            var result = await _graph.FullSyncAsync(ct);
            return Ok(new { enabled = true, result.Nodes, result.Relationships, result.DurationMs });
        }

        /// <summary>Trạng thái đồng bộ + đếm node/edge.</summary>
        [HttpGet("health")]
        public async Task<IActionResult> Health() => Ok(await _graph.HealthAsync());
    }
}
