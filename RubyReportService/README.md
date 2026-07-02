# RubyReportService

RubyReportService la microservice Ruby/Sinatra dung de xuat bao cao CSV cho VolunteerHub.

## Endpoints

Health khong can token:

```text
GET /health
GET /api/reports/health
GET /api/reports/ready
```

Report can JWT role `Admin`:

```text
GET /api/reports
GET /api/reports/summary
GET /api/reports/events.csv?limit=1000
GET /api/reports/donations.csv?limit=1000
```

Qua ApiGateway local:

```text
http://localhost:5000/api/reports/events.csv
```

## Local dev

```bash
cd RubyReportService
bundle install
set DATABASE_URL=Server=localhost,1433;Database=VolunteerHub;User Id=sa;Password=your_password;TrustServerCertificate=true;Encrypt=false
set JWT_SECRET=your_jwt_secret
set PORT=5005
bundle exec puma -C config/puma.rb
```

## Docker

Service duoc gan vao `docker-compose.yml` va `docker-compose.nginx.yml` voi ten container `reportservice`.
