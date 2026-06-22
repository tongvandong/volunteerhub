# Hướng Dẫn Cấu Hình Auto-Deploy VolunteerHub

Tài liệu này bám theo mô hình đã dùng cho MoToSale/XeMoto: GitHub Actions self-hosted runner chạy ngay trên VPS. Khi push vào `main`, runner tự `git reset`, `docker compose build`, `docker compose up -d`.

Thông tin:

- Repo deploy: `https://github.com/tongvandong/volunteerhub`
- Branch deploy: `main`
- VPS clone tại: `/opt/volunteerhub`
- Compose file: `docker-compose.nginx.yml`

## 0. Lưu Ý Bảo Mật

Nếu repo public, self-hosted runner có rủi ro khi workflow bị lạm dụng. Khuyến nghị để repo private. Nếu vẫn public, workflow chỉ trigger `push` vào `main`, không trigger `pull_request`.

## 1. Chuẩn Bị VPS

Chạy bằng root:

```bash
adduser deploy
usermod -aG docker deploy
chown -R deploy:deploy /opt/volunteerhub
```

Kiểm tra user deploy gọi được Docker:

```bash
su - deploy -c 'docker ps'
```

## 2. Đăng Ký Runner

Trên GitHub:

```text
volunteerhub > Settings > Actions > Runners > New self-hosted runner > Linux / X64
```

GitHub sẽ hiện block lệnh có URL, version, hash và token. Chạy bằng user `deploy`:

```bash
su - deploy
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-<VERSION>.tar.gz -L <URL_GITHUB_DUA>
echo "<HASH_GITHUB_DUA>  actions-runner-linux-x64-<VERSION>.tar.gz" | shasum -a 256 -c
tar xzf ./actions-runner-linux-x64-<VERSION>.tar.gz
./config.sh --url https://github.com/tongvandong/volunteerhub --token <TOKEN_GITHUB_DUA>
```

Khi được hỏi, Enter theo mặc định.

Test foreground:

```bash
./run.sh
```

Thấy `Listening for Jobs` là được, sau đó `Ctrl+C`.

## 3. Cài Runner Thành Service

Quay lại root:

```bash
exit
cd /home/deploy/actions-runner
./svc.sh install deploy
./svc.sh start
./svc.sh status
```

Nếu vừa thêm user vào group docker:

```bash
./svc.sh stop
./svc.sh start
```

## 4. Workflow Deploy

File workflow của VolunteerHub đặt tại:

```text
.github/workflows/deploy.yml
```

Nội dung:

```yaml
name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: volunteerhub-deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - name: Redeploy on VPS
        run: |
          set -e
          cd /opt/volunteerhub
          git fetch origin
          git reset --hard origin/main
          export COMPOSE_PARALLEL_LIMIT=1
          docker compose -f docker-compose.nginx.yml --env-file .env build
          docker compose -f docker-compose.nginx.yml --env-file .env up -d
          docker compose -f docker-compose.nginx.yml --env-file .env ps
```

`COMPOSE_PARALLEL_LIMIT=1` giúp VPS RAM thấp build từng service một, tránh nghẽn Docker khi SQL Server, Neo4j và các service .NET đang chạy.

## 5. Chạy Thử

Local:

```powershell
cd D:\FW\FW\BaseCore
git add .github/workflows/deploy.yml docker-compose.nginx.yml docs deploy
git commit -m "ci: add volunteerhub vps auto deploy"
git push origin main
```

Trên GitHub mở tab Actions, xem job `deploy`.

## 6. Quy Trình Hằng Ngày

Sau khi đã có auto-deploy:

```powershell
cd D:\FW\FW\BaseCore
git add .
git commit -m "fix: ..."
git push origin main
```

Runner trên VPS tự deploy. Nếu cần xem log:

```bash
cd /opt/volunteerhub
docker compose -f docker-compose.nginx.yml logs --tail=100 eventservice
```

## 7. Quản Lý Runner

Trên VPS, bằng root:

```bash
cd /home/deploy/actions-runner
./svc.sh status
./svc.sh stop
./svc.sh start
```

Gỡ runner khỏi GitHub thì lấy token remove trong trang Runners rồi chạy:

```bash
su - deploy -c 'cd ~/actions-runner && ./config.sh remove --token <TOKEN>'
```

## 8. Lỗi Thường Gặp

- Runner Offline: `./svc.sh status`, rồi `./svc.sh start`.
- Job queued mãi: runner chưa online hoặc label không khớp.
- Permission denied khi gọi Docker: user `deploy` chưa vào group `docker`, hoặc chưa restart runner.
- Build lỗi: SSH vào VPS chạy `cd /opt/volunteerhub && docker compose -f docker-compose.nginx.yml build`.
- Web vẫn code cũ: `docker compose -f docker-compose.nginx.yml build --no-cache web && docker compose -f docker-compose.nginx.yml up -d web`.

Không chạy:

```bash
docker compose -f docker-compose.nginx.yml down -v
```
