using BaseCore.Services.VolunteerHub;

namespace BaseCore.APIService
{
    public class EventLifecycleHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<EventLifecycleHostedService> _logger;

        public EventLifecycleHostedService(IServiceProvider serviceProvider, ILogger<EventLifecycleHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await RunLifecycleChecksAsync(stoppingToken);

            using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await RunLifecycleChecksAsync(stoppingToken);
            }
        }

        private async Task RunLifecycleChecksAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var eventService = scope.ServiceProvider.GetRequiredService<IEventService>();

                var notificationsSent = await eventService.NotifyUnderstaffedUpcomingAsync();
                var eventsCompleted = await eventService.AutoCompleteOverdueAsync();

                if (notificationsSent > 0 || eventsCompleted > 0)
                {
                    _logger.LogInformation(
                        "Event lifecycle checks completed: {NotificationsSent} understaffed reminders sent, {EventsCompleted} events auto-completed.",
                        notificationsSent,
                        eventsCompleted);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Expected during application shutdown.
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Event lifecycle checks failed.");
            }
        }
    }
}