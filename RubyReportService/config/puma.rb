port ENV.fetch("PORT", 8080)
environment ENV.fetch("RACK_ENV", "development")
workers Integer(ENV.fetch("WEB_CONCURRENCY", 0))
threads_count = Integer(ENV.fetch("RAILS_MAX_THREADS", 5))
threads threads_count, threads_count
preload_app! if ENV.fetch("WEB_CONCURRENCY", "0").to_i.positive?
