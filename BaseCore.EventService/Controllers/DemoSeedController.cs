using BaseCore.EventService.Demo;
using BaseCore.EventService.Graph;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.EventService.Controllers
{
    [ApiController]
    [Route("api/admin/dev")]
    [Authorize(Roles = "Admin")]
    public class DemoSeedController : ControllerBase
    {
        private readonly DemoSeederService _seeder;
        private readonly GraphSyncService _graph;
        private readonly IWebHostEnvironment _env;
        private readonly IConfiguration _config;

        public DemoSeedController(DemoSeederService seeder, GraphSyncService graph,
            IWebHostEnvironment env, IConfiguration config)
        {
            _seeder = seeder;
            _graph = graph;
            _env = env;
            _config = config;
        }

        // Chặn ở production trừ khi bật cờ Demo:SeedEnabled=true.
        private bool Allowed =>
            !_env.IsProduction() || string.Equals(_config["Demo:SeedEnabled"], "true", StringComparison.OrdinalIgnoreCase);

        [HttpPost("seed")]
        public async Task<IActionResult> Seed([FromQuery] string scale = "medium", CancellationToken ct = default)
        {
            if (!Allowed) return Forbid();
            var report = await _seeder.SeedAsync(scale, ct);
            if (!report.AlreadySeeded && _graph.Enabled)
            {
                await _graph.EnsureSchemaAsync(ct);
                await _graph.FullSyncAsync(ct);
            }
            return Ok(report);
        }

        [HttpPost("seed/clear")]
        public async Task<IActionResult> Clear(CancellationToken ct = default)
        {
            if (!Allowed) return Forbid();
            var removed = await _seeder.ClearAsync(ct);
            if (_graph.Enabled)
            {
                await _graph.EnsureSchemaAsync(ct);
                await _graph.FullSyncAsync(ct);
            }
            return Ok(new { removedUsers = removed });
        }
    }
}
