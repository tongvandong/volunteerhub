FROM ruby:3.3-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      curl \
      freetds-bin \
      freetds-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Gemfile ./
RUN bundle install

COPY . .

ENV RACK_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
