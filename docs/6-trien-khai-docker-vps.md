# 6. Triển khai Docker + Redis + VPS

Tài liệu hướng dẫn đóng gói toàn bộ VolunteerHub bằng Docker và đưa lên một VPS.

## 6.1. Kiến trúc

Toàn bộ hệ thống chạy trong **một `docker-compose.yml`** trên một máy chủ:

```
Internet ──► web (Caddy, cổng 80/443)
              ├─ /            → SPA React (file tĩnh trong image)
              ├─ /api/*       → gateway:8080 (Ocelot) → auth/event/finance/api
              └─ /hubs/*      → eventservice:8080 (SignalR realtime, có websocket)

Mạng nội bộ (không lộ ra Internet):
  gateway, apiservice, authservice, eventservice, financeservice,
  certificateworker (Rust), sqlserver, redis
```

| Thành phần | Image / Build | Vai trò |
|---|---|---|
| `web` | `deploy/web.Dockerfile` (Node build → Caddy) | Serve SPA + reverse proxy + HTTPS tự động |
| `gateway` | `deploy/dotnet-service.Dockerfile` | API Gateway (Ocelot), dùng `ocelot.docker.json` |
| `apiservice` / `authservice` / `eventservice` / `financeservice` | `deploy/dotnet-service.Dockerfile` | 4 microservice .NET, đều listen cổng `8080` nội bộ |
| `certificateworker` | `deploy/certificateworker.Dockerfile` | Worker Rust sinh PDF chứng chỉ |
| `sqlserver` | `mcr.microsoft.com/mssql/server:2022-latest` | CSDL |
| `redis` | `redis:7-alpine` | Cache phân tán + SignalR backplane |

### Redis được dùng cho 2 việc
1. **SignalR backplane** (EventService) — realtime hoạt động đúng kể cả khi scale nhiều instance.
2. **Distributed cache** (`IDistributedCache` qua `RedisUtils`) — giảm tải DB cho các API đọc nhiều.

> Nếu không cấu hình `Redis__ConnectionString`, mỗi service tự fallback sang cache in-memory để vẫn chạy được (tiện cho dev/test).

### Lưu trữ bền (volume)
| Volume | Mount | Lý do |
|---|---|---|
| `mssql_data` | `sqlserver:/var/opt/mssql` | Dữ liệu DB |
| `redis_data` | `redis:/data` | Redis AOF |
| `uploads_data` | `authservice:/app/wwwroot/uploads` | Ảnh & tài liệu người dùng upload |
| `certificates_data` | `eventservice:/app/wwwroot/certificates` **và** `certificateworker:/data/certificates` | PDF chứng chỉ (worker ghi, service đọc — **dùng chung 1 volume**) |
| `caddy_data` / `caddy_config` | `web` | Chứng chỉ TLS Let's Encrypt |

## 6.2. Chạy thử ở máy local

Yêu cầu: **Docker Desktop** (kèm Docker Compose v2).

```bash
cd D:/FW/FW/BaseCore
cp .env.example .env          # rồi sửa mật khẩu trong .env
docker compose build          # build lần đầu khá lâu (SDK .NET + Rust + Node)
docker compose up -d
docker compose ps             # chờ các service chuyển sang (healthy)
```

Mở trình duyệt: <http://localhost>

Các lệnh hữu ích:
```bash
docker compose logs -f eventservice   # xem log 1 service
docker compose logs -f certificateworker
docker compose down                   # dừng (giữ dữ liệu trong volume)
docker compose down -v                # dừng + XÓA SẠCH dữ liệu (volume)
```

> **Khởi động lần đầu chậm** là bình thường: các service .NET khởi động **nối tiếp** (service sau chờ service trước `healthy`) để migration tự chạy tuần tự, tránh đụng nhau trên DB mới.

## 6.3. Triển khai lên VPS

1. **Chuẩn bị VPS**: Ubuntu 22.04, **RAM ≥ 4GB** (SQL Server cần ~1.5–2GB), cài Docker + Compose:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
2. **Mở firewall** cổng 80 và 443.
3. **Domain** (khuyến nghị): trỏ bản ghi A của domain về IP VPS.
4. **Lấy code + cấu hình**:
   ```bash
   git clone <repo> && cd BaseCore
   cp .env.example .env
   ```
   Sửa `.env`:
   - `SA_PASSWORD`, `JWT_SECRET`, `REDIS_PASSWORD`: đặt giá trị mạnh, ngẫu nhiên.
   - `PUBLIC_URL=https://volunteerhub.example.com`
   - `SITE_ADDRESS=volunteerhub.example.com`  ← đặt domain ở đây thì Caddy **tự cấp HTTPS**.
5. **Chạy**:
   ```bash
   docker compose build
   docker compose up -d
   ```
6. Truy cập `https://<domain>` — chứng chỉ TLS được cấp tự động trong ~30 giây đầu.

### Tài khoản seed (đổi mật khẩu ngay sau khi lên production)
`admin/admin123` · `organizer/organizer123` · `sponsor/sponsor123` · `volunteer/volunteer123`

## 6.4. Vận hành

```bash
# Cập nhật phiên bản mới
git pull && docker compose build && docker compose up -d

# Backup database
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P "$SA_PASSWORD" -C -Q "BACKUP DATABASE VolunteerHub TO DISK='/var/opt/mssql/vhub.bak'"

# Backup volume file upload / chứng chỉ
docker run --rm -v volunteerhub_uploads_data:/d -v $(pwd):/b alpine tar czf /b/uploads.tgz -C /d .
```

## 6.5. Những điều đã chỉnh để chạy được trong Docker

- **`ocelot.docker.json`**: bản sao của `ocelot.json` nhưng host trỏ tới tên service (`authservice:8080`…) thay vì `localhost:5xxx`. Gateway chọn file qua env `Ocelot__ConfigFile`.
- **SignalR ở SPA**: URL hub đọc từ `VITE_HUB_URL` (build = `/hubs/channel`, same-origin qua Caddy) thay vì hardcode `localhost:5003`.
- **CORS EventService**: đọc từ `Cors__AllowedOrigins` (env) thay vì khóa cứng `localhost:3000`.
- **Worker Rust**: trên Linux kết nối SQL Server qua TCP bằng `tiberius` với tài khoản SQL (`DATABASE_URL` dạng ADO), không dùng đường LocalDB/sqlcmd.
- **Cấu hình qua biến môi trường**: connection string, JWT, Redis… nạp từ env (`ConnectionStrings__ConnectedDb`, `Jwt__SecretKey`, `Redis__ConnectionString`).

## 6.6. Lưu ý / hạn chế

- Hiện chạy **một instance mỗi service**. Redis backplane đã sẵn sàng cho việc scale EventService về sau, nhưng muốn scale thì cần thêm load balancer cho từng service (chưa cấu hình ở đây).
- SQL Server bản `Developer` (miễn phí, không dùng cho thương mại). Production thương mại cần license phù hợp hoặc chuyển sang DB khác.
- Đây là triển khai **single-VPS**, phù hợp giai đoạn đầu / nội bộ. Khi tải lớn mới tính tách DB ra dịch vụ managed và scale ngang.
