namespace BaseCore.EventService.Graph
{
    /// <summary>
    /// Periodically rebuilds the knowledge graph from SQL. Never throws out of the loop, so a
    /// graph/Neo4j outage can never take the host down - it just retries next interval.
    /// </summary>
    public sealed class GraphSyncWorker : BackgroundService
    {
        private readonly GraphSyncService _graph;
        private readonly ILogger<GraphSyncWorker> _logger;

        public GraphSyncWorker(GraphSyncService graph, ILogger<GraphSyncWorker> logger)
        {
            _graph = graph;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_graph.Enabled)
            {
                _logger.LogInformation("Knowledge graph disabled (Neo4j:Uri not set). Sync worker idle.");
                return;
            }

            // Give Neo4j a moment after container start before the first attempt.
            try { await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken); }
            catch (OperationCanceledException) { return; }

            try { await _graph.EnsureSchemaAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogWarning(ex, "Graph schema init failed (will retry on next sync)"); }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await _graph.FullSyncAsync(stoppingToken);
                }
                catch (OperationCanceledException) { break; }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Graph sync iteration failed");
                }

                try { await Task.Delay(_graph.SyncInterval, stoppingToken); }
                catch (OperationCanceledException) { break; }
            }
        }
    }
}
