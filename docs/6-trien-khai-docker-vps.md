# 6. Triển Khai Docker + Redis + VPS

Tài liệu này mô tả cách đóng gói VolunteerHub bằng Docker Compose. Mô hình hiện tại đã bỏ Caddy:

- Container `web` dùng nginx để serve SPA React và reverse proxy nội bộ `/api`, `/hubs`.
- Nếu deploy VPS có domain/HTTPS, dùng nginx + Certbot trên host theo file `docs/DEPLOY_VPS_NGINX_GUIDE.md`.

## 6.1. Kiến Trúc

```text
Internet
  -> nginx host VPS :80/:443
  -> 127.0.0.1:8080
  -> web container (nginx)
       /       -> SPA React
       /api/*  -> gateway:8080
       /hubs/* -> eventservice:8080 (SignalR websocket)

Mạng Docker nội bộ:
  gateway, authservice, eventservice, financeservice,
  certificateworker (Rust), sqlserver, redis, neo4j
```

| Thành phần | Image / Build | Vai trò |
|---|---|---|
| `web` | `deploy/web.Dockerfile` (Node build -> nginx) | Serve SPA + reverse proxy nội bộ |
| `gateway` | `deploy/dotnet-service.Dockerfile` | API Gateway Ocelot |
| `authservice` | `deploy/dotnet-service.Dockerfile` | Xác thực, tài khoản |
| `eventservice` | `deploy/dotnet-service.Dockerfile` | Event, đăng ký, điểm danh, donation, sponsorship, notification |
| `financeservice` | `deploy/dotnet-service.Dockerfile` | Báo cáo tài chính |
| `certificateworker` | `deploy/certificateworker.Dockerfile` | Worker Rust sinh PDF chứng chỉ |
| `sqlserver` | `mcr.microsoft.com/mssql/server:2022-latest` | CSDL chính |
| `redis` | `redis:7-alpine` | Cache + SignalR backplane |
| `neo4j` | `neo4j:5-community` | Knowledge graph |

## 6.2. Volume Bền

| Volume | Lý do |
|---|---|
| `mssql_data` | Dữ liệu SQL Server |
| `redis_data` | Redis AOF |
| `neo4j_data` | Dữ liệu graph |
| `uploads_data` | Ảnh và tài liệu upload |
| `certificates_data` | PDF chứng chỉ, dùng chung giữa eventservice và certificateworker |

## 6.3. Chạy Thử Local

```bash
cd D:/FW/FW/BaseCore
cp .env.example .env
docker compose build
docker compose up -d
docker compose ps
```

Mở trình duyệt:

```text
http://localhost
```

Lệnh hữu ích:

```bash
docker compose logs -f eventservice
docker compose logs -f certificateworker
docker compose down
docker compose down -v
```

Không dùng `down -v` nếu muốn giữ DB, uploads và certificates.

## 6.4. Deploy VPS Có Nginx Host

Khi deploy lên VPS dùng domain/HTTPS, dùng compose riêng:

```bash
docker compose -f docker-compose.nginx.yml --env-file .env build
docker compose -f docker-compose.nginx.yml --env-file .env up -d
```

Compose này bind `web` vào:

```text
127.0.0.1:8080
```

Host nginx sẽ proxy domain về `http://127.0.0.1:8080` và Certbot cấp HTTPS. Xem hướng dẫn chi tiết trong:

```text
docs/DEPLOY_VPS_NGINX_GUIDE.md
```

## 6.5. Cấu Hình `.env`

Các biến quan trọng:

```text
SA_PASSWORD=...
JWT_SECRET=...
REDIS_PASSWORD=...
NEO4J_PASSWORD=...
PUBLIC_URL=https://volunteerhub.example.com
```

Nếu cần dữ liệu demo khi chấm:

```text
DEMO_SEED_ENABLED=true
```

Nếu deploy nghiêm túc, không bật seed demo.

## 6.6. Tài Khoản Seed

Chỉ dùng cho demo và nên đổi mật khẩu nếu deploy công khai:

```text
admin/admin123
organizer/organizer123
sponsor/sponsor123
volunteer/volunteer123
```

## 6.7. Vận Hành

```bash
cd /opt/volunteerhub
docker compose -f docker-compose.nginx.yml ps
docker compose -f docker-compose.nginx.yml logs -f eventservice
docker compose -f docker-compose.nginx.yml restart
```

Backup database:

```bash
docker compose -f docker-compose.nginx.yml exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P "$SA_PASSWORD" -C -Q "BACKUP DATABASE VolunteerHub TO DISK='/var/opt/mssql/vhub.bak'"
```

## 6.8. Những Điều Đã Chỉnh Để Chạy Docker

- `ocelot.docker.json`: gateway trỏ tới tên service Docker thay vì localhost.
- SPA dùng `VITE_HUB_URL=/hubs/channel`, same-origin qua nginx.
- EventService đọc CORS từ `Cors__AllowedOrigins`.
- Worker Rust kết nối SQL Server qua TCP bằng `DATABASE_URL`.
- Connection string, JWT, Redis đọc qua biến môi trường.

## 6.9. Lưu Ý

- SQL Server bản Developer phù hợp demo/học tập, không dùng cho thương mại.
- VPS nên có tối thiểu 4GB RAM vì chạy SQL Server, Neo4j và nhiều .NET service.
- Không public port SQL Server, Redis, Neo4j.
- Chỉ mở SSH, HTTP, HTTPS trên firewall.
