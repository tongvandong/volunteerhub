# Hướng Dẫn Deploy VolunteerHub Lên VPS Ubuntu + Nginx

Tài liệu này bám theo quy trình deploy MoToSale/XeMoto trước đây: Docker Compose chạy ứng dụng, nginx + Certbot đứng ngoài để trỏ domain và HTTPS.

Thông tin project:

- Repo deploy: `https://github.com/tongvandong/volunteerhub`
- Branch khuyến nghị deploy: `main`
- Thư mục VPS khuyến nghị: `/opt/volunteerhub`
- OS khuyến nghị: Ubuntu 24.04 x86_64
- Compose dùng cho nginx: `docker-compose.nginx.yml`

Không ghi mật khẩu VPS, mật khẩu SQL, JWT secret thật vào tài liệu hoặc commit.

## 1. Trỏ DNS Domain Về VPS

Trong trang quản lý DNS, tạo bản ghi:

| Type | Name/Host | Value | TTL |
|---|---|---|---|
| A | `@` hoặc subdomain bạn dùng | IP VPS | `300` hoặc `Auto` |

Kiểm tra DNS trên Windows:

```powershell
Resolve-DnsName volunteerhub.example.com -Server 1.1.1.1
```

Trên Linux/macOS:

```bash
dig volunteerhub.example.com @1.1.1.1
```

## 2. SSH Vào VPS

```bash
ssh root@<VPS_IP>
```

Kiểm tra OS:

```bash
lsb_release -a
uname -a
```

## 3. Cài Gói Cần Thiết

```bash
apt update
apt install -y ca-certificates curl git docker.io docker-compose-v2 nginx certbot python3-certbot-nginx ufw openssl
systemctl enable --now docker
systemctl enable --now nginx
```

Nếu VPS từng cài Caddy và nó đang chiếm port 80/443:

```bash
systemctl stop caddy
systemctl disable caddy
```

Kiểm tra:

```bash
docker --version
docker compose version
nginx -v
certbot --version
```

## 4. Clone Source

```bash
cd /opt
git clone https://github.com/tongvandong/volunteerhub.git
cd /opt/volunteerhub
git checkout main
```

Nếu thư mục đã tồn tại:

```bash
cd /opt/volunteerhub
git pull --ff-only
```

## 5. Tạo File `.env`

```bash
cp .env.example .env
```

Sinh secret:

```bash
SA_PASSWORD="VolunteerHub@$(openssl rand -hex 12)A1!"
JWT_SECRET="$(openssl rand -base64 48)"
REDIS_PASSWORD="Redis@$(openssl rand -hex 12)A1!"
NEO4J_PASSWORD="Neo4j@$(openssl rand -hex 12)A1!"

sed -i "s|^SA_PASSWORD=.*|SA_PASSWORD=${SA_PASSWORD}|" .env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=${REDIS_PASSWORD}|" .env
sed -i "s|^NEO4J_PASSWORD=.*|NEO4J_PASSWORD=${NEO4J_PASSWORD}|" .env
sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=https://volunteerhub.example.com|" .env
```

Nếu muốn bật dữ liệu demo trong lần chấm/demo:

```bash
echo "DEMO_SEED_ENABLED=true" >> .env
```

Nếu deploy dùng thật, để mặc định `DEMO_SEED_ENABLED=false` hoặc không khai báo.

Không commit `.env`.

## 6. Build Và Chạy Docker Compose

```bash
cd /opt/volunteerhub
docker compose -f docker-compose.nginx.yml --env-file .env build
docker compose -f docker-compose.nginx.yml --env-file .env up -d
docker compose -f docker-compose.nginx.yml --env-file .env ps
```

Các service chính:

- `sqlserver`: SQL Server
- `redis`: Redis
- `neo4j`: Knowledge graph
- `authservice`: xác thực/tài khoản
- `eventservice`: event, volunteer, organizer, donation, sponsorship, notification
- `financeservice`: tài chính/báo cáo
- `gateway`: API Gateway/Ocelot
- `certificateworker`: worker Rust tạo PDF chứng chỉ
- `web`: frontend + reverse proxy nội bộ

Test tạm trên VPS:

```bash
curl -I http://127.0.0.1:8080
curl http://127.0.0.1:8080/api/monitoring/health
```

Xem log:

```bash
docker compose -f docker-compose.nginx.yml logs --tail=100 gateway
docker compose -f docker-compose.nginx.yml logs --tail=100 eventservice
docker compose -f docker-compose.nginx.yml logs --tail=100 web
```

## 7. Cấu Hình Nginx Reverse Proxy

Tạo site:

```bash
nano /etc/nginx/sites-available/volunteerhub
```

Nội dung mẫu, đổi `volunteerhub.example.com` thành domain thật:

```nginx
server {
    listen 80;
    server_name volunteerhub.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /hubs/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600;
        proxy_send_timeout 3600;
    }
}
```

Bật site:

```bash
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/volunteerhub /etc/nginx/sites-enabled/volunteerhub
nginx -t
systemctl reload nginx
```

## 8. Cấp HTTPS Bằng Certbot

Đảm bảo DNS đã trỏ đúng trước khi chạy:

```bash
certbot --nginx -d volunteerhub.example.com
```

Kiểm tra:

```bash
nginx -t
systemctl status nginx --no-pager
certbot certificates
curl -I https://volunteerhub.example.com
```

## 9. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

Không cần public các port app. `web` chỉ bind `127.0.0.1:8080`.

## 10. Test Sau Deploy

```bash
cd /opt/volunteerhub
docker compose -f docker-compose.nginx.yml ps
curl -I https://volunteerhub.example.com
curl https://volunteerhub.example.com/api/monitoring/health
```

Mở browser:

```text
https://volunteerhub.example.com
```

Kiểm tra nhanh các luồng:

- Đăng nhập admin/organizer/volunteer/sponsor.
- Organizer tạo event.
- Admin duyệt event.
- Volunteer đăng ký event.
- Organizer xác nhận tham gia.
- Tạo đợt ủng hộ có thông tin nhận tiền.
- Tải chứng chỉ PDF sau khi hoàn thành event.

## 11. Lệnh Vận Hành Nhanh

```bash
cd /opt/volunteerhub
docker compose -f docker-compose.nginx.yml ps
docker compose -f docker-compose.nginx.yml restart
docker compose -f docker-compose.nginx.yml logs -f eventservice
```

Không dùng nếu không muốn xóa DB và file:

```bash
docker compose -f docker-compose.nginx.yml down -v
```

## 12. Ghi Chú Bảo Mật

- Không public SQL Server port `1433`.
- Không public Redis/Neo4j.
- Không commit `.env`.
- Nên dùng SSH key thay password.
- Nên đổi mật khẩu root nếu đã từng chia sẻ.
- Backup volume SQL Server định kỳ nếu dùng lâu dài.
