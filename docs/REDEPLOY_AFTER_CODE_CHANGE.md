# Hướng Dẫn Redeploy VolunteerHub Sau Khi Sửa Code

Tài liệu này dùng cho quy trình 1 repo:

- Local repo: `D:\FW\FW\BaseCore`
- Repo deploy: `https://github.com/tongvandong/volunteerhub`
- VPS clone tại: `/opt/volunteerhub`
- Compose deploy nginx: `docker-compose.nginx.yml`

## Nguyên Tắc

- Không sửa trực tiếp file trong container.
- Không commit `.env`.
- Không chạy `docker compose down -v` nếu không muốn xóa DB, uploads, certificates.
- Nên build trước rồi mới `up -d` để nếu build lỗi thì app cũ vẫn còn chạy.

## 1. Test Local Trước Khi Push

```powershell
cd D:\FW\FW\BaseCore
dotnet build BaseCore.sln --configuration Release
cd D:\FW\FW\BaseCore\BaseCore.WebClient
npm run build
```

Nếu có chỉnh Docker:

```powershell
cd D:\FW\FW\BaseCore
docker compose -f docker-compose.nginx.yml config --quiet
```

## 2. Commit Và Push

```powershell
cd D:\FW\FW\BaseCore
git status
git add .
git commit -m "fix: update volunteerhub"
git push origin main
```

Nếu đang làm ở branch khác, merge hoặc PR vào `main` trước khi deploy.

## 3. Pull + Build + Chạy Trên VPS

```bash
cd /opt/volunteerhub
git pull --ff-only
docker compose -f docker-compose.nginx.yml --env-file .env build
docker compose -f docker-compose.nginx.yml --env-file .env up -d
docker compose -f docker-compose.nginx.yml --env-file .env ps
```

## 4. Xem Log Sau Deploy

```bash
docker compose -f docker-compose.nginx.yml logs --tail=100 authservice
docker compose -f docker-compose.nginx.yml logs --tail=100 eventservice
docker compose -f docker-compose.nginx.yml logs --tail=100 financeservice
docker compose -f docker-compose.nginx.yml logs --tail=100 gateway
docker compose -f docker-compose.nginx.yml logs --tail=100 web
docker compose -f docker-compose.nginx.yml logs --tail=100 certificateworker
```

## 5. Chỉ Sửa Frontend

```bash
cd /opt/volunteerhub
git pull --ff-only
docker compose -f docker-compose.nginx.yml build web
docker compose -f docker-compose.nginx.yml up -d web
```

Hard refresh browser: `Ctrl + F5`.

## 6. Chỉ Sửa Backend

Build service liên quan:

```bash
cd /opt/volunteerhub
git pull --ff-only
docker compose -f docker-compose.nginx.yml build eventservice gateway
docker compose -f docker-compose.nginx.yml up -d eventservice gateway
```

Nếu không chắc sửa service nào:

```bash
docker compose -f docker-compose.nginx.yml build
docker compose -f docker-compose.nginx.yml up -d
```

## 7. Nếu Có Migration DB

Các .NET service đang tự chạy migration khi start. Sau deploy, xem log service chính:

```bash
docker compose -f docker-compose.nginx.yml logs --tail=200 eventservice
docker compose -f docker-compose.nginx.yml logs --tail=200 authservice
```

Nên backup DB trước migration lớn.

## 8. Lệnh Không Nên Dùng

```bash
docker compose -f docker-compose.nginx.yml down -v
```

`-v` sẽ xóa volume SQL Server, Redis, Neo4j, uploads, certificates.

## 9. Lỗi Thường Gặp

### Web vẫn hiện code cũ

```bash
cd /opt/volunteerhub
git log -1 --oneline
docker compose -f docker-compose.nginx.yml build --no-cache web
docker compose -f docker-compose.nginx.yml up -d web
```

### API lỗi 500

```bash
docker compose -f docker-compose.nginx.yml logs --tail=200 eventservice
docker compose -f docker-compose.nginx.yml logs --tail=200 gateway
```

### Gateway không gọi được service

```bash
docker compose -f docker-compose.nginx.yml ps
docker compose -f docker-compose.nginx.yml logs --tail=100 gateway
curl http://127.0.0.1:8080/api/monitoring/health
```

### Nginx lỗi HTTPS hoặc websocket

```bash
nginx -t
systemctl status nginx --no-pager
certbot certificates
```

Đảm bảo block `/hubs/` có `Upgrade` và `Connection "upgrade"`.

## 10. Quy Trình Nhanh

Local:

```powershell
cd D:\FW\FW\BaseCore
git add .
git commit -m "fix: update demo"
git push origin main
```

VPS:

```bash
cd /opt/volunteerhub
git pull --ff-only
docker compose -f docker-compose.nginx.yml build
docker compose -f docker-compose.nginx.yml up -d
docker compose -f docker-compose.nginx.yml ps
```
