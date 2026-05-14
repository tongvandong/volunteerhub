# Hướng dẫn tạo repo mới và commit theo timeline

## Tổng quan

Repo mới sẽ được commit theo 6 tuần. Mỗi người làm phần mình trên branch riêng rồi merge vào main. Kết quả cuối cùng: git log trông tự nhiên, mỗi người có commit đều đặn.

## Cấu trúc repo đồ án

```
volunteerhub-group10/
├── docs/                              ← 5 file tài liệu chính
│   ├── 1-mo-ta-de-tai.md
│   ├── 2-yeu-cau-chuc-nang.md
│   ├── 3-thiet-ke-he-thong.md
│   ├── 4-huong-dan-cai-dat.md
│   └── 5-phan-cong-nhom.md
├── docs/internal/                     ← Tài liệu nội bộ (flow spec chi tiết, dev reference)
│   ├── event-registration-flow.md
│   ├── sponsorship-donation-flow.md
│   ├── real-world-scenarios.md
│   └── demo-workflow.md
├── Thực tập nhóm/                     ← Biên bản + báo cáo + slide
│   ├── Bien_ban_tuan_1.docx
│   ├── ...
│   ├── Bao_cao_tong_hop.docx
│   └── Slide_thuyet_trinh.pptx
├── BaseCore.sln
├── BaseCore.ApiGateway/
├── BaseCore.AuthService/
├── BaseCore.EventService/
├── BaseCore.FinanceService/
├── BaseCore.APIService/
├── BaseCore.Entities/
├── BaseCore.Repository/
├── BaseCore.Services/
├── BaseCore.Common/
├── BaseCore.WebClient/
├── README.md
├── .gitignore
└── seed_data.sql
```

## Bước 0: Chuẩn bị

### Tạo repo trên GitHub

1. Vào https://github.com/new
2. Tên repo: `volunteerhub-group10` (hoặc tên nhóm bạn chọn)
3. Chọn Private (hoặc Public tùy ý)
4. KHÔNG tick "Add README" — để repo trống
5. Bấm "Create repository"
6. Vào Settings → Collaborators → Add 2 account còn lại

### Clone về máy

```powershell
cd D:\FW\FW
git clone https://github.com/taoladong/volunteerhub-group10.git
cd volunteerhub-group10
```

---

## TUẦN 1 — Phân tích yêu cầu

**Ai làm**: Cả 3 người, mỗi người commit phần mình.

### Người A (Identity) commit:

1. Tạo cấu trúc folder:
```powershell
mkdir docs
mkdir "Thực tập nhóm"
```

2. Copy từ repo cũ (`D:\FW\FW\BaseCore\docs\`):
   - `docs/1-mo-ta-de-tai.md`
   - `.gitignore`
   - `README.md` (chỉ giữ phần giới thiệu ngắn, chưa có hướng dẫn chạy chi tiết)

```powershell
git add .
git commit -m "docs: add project description and initial setup"
git push origin main
```

### Người B (Event) commit:

1. Pull: `git pull origin main`
2. Copy `docs/2-yeu-cau-chuc-nang.md` từ repo cũ (phần FR-01 đến FR-19 — event/registration/attendance/certificate/rating/channel).

```powershell
git add docs/2-yeu-cau-chuc-nang.md
git commit -m "docs: add functional requirements for event and registration flows"
git push origin main
```

### Người C (Finance) commit:

1. Pull: `git pull origin main`
2. Bổ sung vào `docs/2-yeu-cau-chuc-nang.md` — thêm FR-20 đến FR-28 (finance, admin, notification, upload).
3. Copy `docs/internal/sponsorship-donation-flow.md` từ repo cũ (`Context/VolunteerHub-sponsorship-donation-flow-spec.md`).

```powershell
mkdir docs/internal
git add docs/
git commit -m "docs: add finance, sponsorship and admin requirements"
git push origin main
```

### Biên bản tuần 1

Tạo file `Thực tập nhóm/Bien_ban_tuan_1.docx` theo mẫu. Ai commit cũng được.

```powershell
git add "Thực tập nhóm/"
git commit -m "docs: add meeting minutes week 1"
git push origin main
```

---

## TUẦN 2 — Thiết kế hệ thống

### Người A commit:

1. Pull: `git pull origin main`
2. Tạo solution structure (copy từ repo cũ, CHỈ lấy):
   - `BaseCore.sln`
   - `BaseCore.Entities/` (toàn bộ `.cs` + `.csproj`)
   - `BaseCore.Common/` (toàn bộ)
   - `BaseCore.DTO/` (toàn bộ)
   - `BaseCore.Repository/` (`.csproj`, `MySqlDbContext.cs`, `Infrastructure/`, `EFCore/`, migration `InitialDatabase` + snapshot)
   - `BaseCore.Libs/` (toàn bộ)

```powershell
git add .
git commit -m "feat: create solution structure with entities and repository layer"
git push origin main
```

3. Copy `docs/3-thiet-ke-he-thong.md` và `docs/5-phan-cong-nhom.md` từ repo cũ.

```powershell
git add docs/
git commit -m "docs: add system design and team assignment"
git push origin main
```

### Người B commit:

1. Pull: `git pull origin main`
2. Copy `docs/internal/event-registration-flow.md` từ repo cũ (`Context/VolunteerHub-event-registration-participation-flow-spec.md`).

```powershell
git add docs/internal/
git commit -m "docs: add event registration flow spec"
git push origin main
```

### Người C commit:

1. Pull: `git pull origin main`
2. Copy `docs/internal/real-world-scenarios.md` từ repo cũ (`Context/VolunteerHub-real-world-scenarios.md`).

```powershell
git add docs/internal/
git commit -m "docs: add real-world business scenarios"
git push origin main
```

### Biên bản tuần 2

```powershell
git add "Thực tập nhóm/Bien_ban_tuan_2.docx"
git commit -m "docs: add meeting minutes week 2"
git push origin main
```

---

## TUẦN 3 — Triển khai backend

**Ai làm**: Mỗi người tạo branch riêng, code phần mình, rồi merge theo thứ tự.

### Người A — branch `feature/identity`

```powershell
git pull origin main
git checkout -b feature/identity
```

Copy vào repo mới (từ repo cũ):
- `BaseCore.AuthService/` (toàn bộ, trừ `bin/`, `obj/`)
- `BaseCore.APIService/Controllers/Identity/` (toàn bộ `.cs`)
- `BaseCore.Services/Authen/` (toàn bộ)
- Bổ sung migrations liên quan (KYC, Verification, VolunteerSkillVerification)

Commit:

```powershell
git add BaseCore.AuthService/
git commit -m "feat(auth): implement login, register, JWT and refresh token"

git add BaseCore.APIService/Controllers/Identity/ BaseCore.Services/Authen/
git commit -m "feat(identity): add profile, KYC, organizer verification, skill verification"

git add BaseCore.Repository/Migrations/
git commit -m "feat(db): add identity-related migrations"

git push origin feature/identity
```

Merge vào main:
```powershell
git checkout main
git pull origin main
git merge feature/identity
git push origin main
```

### Người B — branch `feature/events`

```powershell
git pull origin main
git checkout -b feature/events
```

Copy vào:
- `BaseCore.APIService/` (`.csproj`, `Program.cs`, `appsettings.json`, `Properties/`)
- `BaseCore.APIService/Controllers/Events/` (toàn bộ `.cs`)
- `BaseCore.APIService/Controllers/Shared/` (ChannelsController, RatingsController, NotificationsController, UploadsController)
- `BaseCore.APIService/Controllers/Admin/` (AdminController, BadgesController, CategoriesController, DashboardController, MonitoringController)
- `BaseCore.Services/VolunteerHub/` (toàn bộ: Events/, Engagement/, Admin/)
- Bổ sung migrations còn thiếu

Commit:

```powershell
git add BaseCore.APIService/
git commit -m "feat(api): add APIService with event, admin and shared controllers"

git add BaseCore.Services/VolunteerHub/
git commit -m "feat(services): add event, registration, notification, certificate, badge services"

git add BaseCore.Repository/Migrations/
git commit -m "feat(db): add event and registration migrations"

git push origin feature/events
```

Merge vào main (sau khi A đã merge):
```powershell
git checkout main
git pull origin main
git merge feature/events
git push origin main
```

### Người C — branch `feature/finance`

```powershell
git pull origin main
git checkout -b feature/finance
```

Copy vào:
- `BaseCore.APIService/Controllers/Finance/` (toàn bộ `.cs`)
- `BaseCore.APIService/Controllers/LegacySales/` (nếu muốn giữ)
- Bổ sung migrations finance (SupportCampaigns, SponsorshipProposals, FinancialReports)

Commit:

```powershell
git add BaseCore.APIService/Controllers/Finance/
git commit -m "feat(finance): add support campaign, donation and sponsorship controllers"

git add BaseCore.APIService/Controllers/LegacySales/
git commit -m "feat(legacy): add product and order controllers"

git add BaseCore.Repository/Migrations/
git commit -m "feat(db): add finance migrations"

git push origin feature/finance
```

Merge vào main (sau khi B đã merge):
```powershell
git checkout main
git pull origin main
git merge feature/finance
git push origin main
```

### Biên bản tuần 3

```powershell
git add "Thực tập nhóm/Bien_ban_tuan_3.docx"
git commit -m "docs: add meeting minutes week 3"
git push origin main
```

---

## TUẦN 4 — Frontend + Service split + Tình huống nâng cao

### Người A commit (trên main hoặc branch riêng):

Copy `BaseCore.WebClient/` vào (trừ `node_modules/`, `dist/`).

Chia nhỏ commit:

```powershell
# Setup + public pages
git add BaseCore.WebClient/package.json BaseCore.WebClient/vite.config.js BaseCore.WebClient/index.html BaseCore.WebClient/src/main.jsx BaseCore.WebClient/src/App.jsx BaseCore.WebClient/src/pages/public/ BaseCore.WebClient/src/contexts/ BaseCore.WebClient/src/services/ BaseCore.WebClient/src/components/
git commit -m "feat(ui): add frontend setup, routing, public pages (landing, events)"

# Auth + volunteer pages
git add BaseCore.WebClient/src/pages/auth/ BaseCore.WebClient/src/pages/volunteer/
git commit -m "feat(ui): add auth pages and volunteer flow (profile, registrations, certificates)"

# Organizer + sponsor + admin pages
git add BaseCore.WebClient/
git commit -m "feat(ui): add organizer, sponsor and admin pages"

git push origin main
```

### Người B commit:

Copy vào:
- `BaseCore.EventService/` (trừ `bin/`, `obj/`, `*.log`)
- `BaseCore.ApiGateway/` (trừ `bin/`, `obj/`)
- Cập nhật `BaseCore.sln`

```powershell
git add BaseCore.EventService/ BaseCore.ApiGateway/ BaseCore.sln
git commit -m "feat: add EventService (port 5003) and API Gateway with Ocelot routing"
```

Thêm endpoint tình huống A-G (cancel, resubmit, walk-in, manual-attend, uncomplete, rating moderation):

```powershell
git add BaseCore.APIService/Controllers/Events/ BaseCore.Services/VolunteerHub/Events/ BaseCore.Entities/ BaseCore.Repository/Migrations/
git commit -m "feat: add event cancel, resubmit, walk-in, manual-attend, uncomplete, rating moderation"

git push origin main
```

### Người C commit:

Copy vào:
- `BaseCore.FinanceService/` (trừ `bin/`, `obj/`, `*.log`)

```powershell
git add BaseCore.FinanceService/ BaseCore.sln
git commit -m "feat: add FinanceService (port 5004) with donation and sponsorship"
```

Thêm hardening finance:

```powershell
git add BaseCore.APIService/Controllers/Finance/ BaseCore.APIService/Controllers/Admin/ BaseCore.Entities/SponsorshipProposal.cs BaseCore.Repository/Migrations/
git commit -m "feat(finance): add ActualReceivedAmount, overspend guard, admin finance monitoring"

git push origin main
```

### Biên bản tuần 4

```powershell
git add "Thực tập nhóm/Bien_ban_tuan_4.docx"
git commit -m "docs: add meeting minutes week 4"
git push origin main
```

---

## TUẦN 5 — Test & Fix bug

### Cả nhóm:

1. Chạy hệ thống theo `docs/4-huong-dan-cai-dat.md`.
2. Test theo `docs/internal/demo-workflow.md`.
3. Fix bug nếu có.

### Commit gợi ý (ai fix bug đó commit):

```powershell
git commit -m "fix(events): correct registration status check on cancel-request"
git commit -m "fix(ui): fix mobile layout overflow on event detail page"
git commit -m "fix(finance): validate donation amount against campaign minimum"
```

### Thêm tài liệu:

```powershell
# Copy demo-workflow vào docs/internal/ nếu chưa có
git add docs/internal/demo-workflow.md
git commit -m "docs: add demo workflow guide"

# Cập nhật docs/4-huong-dan-cai-dat.md với hướng dẫn chạy đầy đủ
git add docs/4-huong-dan-cai-dat.md
git commit -m "docs: update setup guide with full instructions"

git push origin main
```

### Biên bản tuần 5

```powershell
git add "Thực tập nhóm/Bien_ban_tuan_5.docx"
git commit -m "docs: add meeting minutes week 5"
git push origin main
```

---

## TUẦN 6 — Báo cáo & Nộp bài

### Cả nhóm:

1. Hoàn thiện báo cáo theo mẫu `Mau_bao_cao_du_an_nhom.docx`.
2. Làm slide thuyết trình (15-20 slide).
3. Tổng hợp biên bản 6 tuần.
4. Đánh giá chéo.
5. Chụp screenshot demo / quay video ngắn.

### Commit cuối:

```powershell
git add "Thực tập nhóm/"
git commit -m "docs: add final report, slides, meeting minutes and peer evaluation"

git add docs/ README.md
git commit -m "docs: finalize all documentation"

git push origin main
```

---

## Quy tắc chung

1. **Luôn pull trước khi commit**: `git pull origin main`.
2. **Không commit `bin/`, `obj/`, `node_modules/`, `*.log`** — đã có `.gitignore`.
3. **Commit message format**:
   - `docs:` cho tài liệu
   - `feat:` cho tính năng mới
   - `fix:` cho sửa bug
   - `chore:` cho setup/config
4. **Mỗi người dùng account GitHub của mình** — giảng viên xem ai đóng góp gì.
5. **Nếu conflict khi merge**: người merge giải quyết, không xóa code người khác.
6. **Trước khi push**: `dotnet build BaseCore.sln` phải pass.

## Thứ tự merge tuần 3-4 (quan trọng)

```
1. A merge feature/identity vào main
2. B pull main → merge feature/events vào main
3. C pull main → merge feature/finance vào main
4. A commit frontend (trên main)
5. B commit EventService + Gateway + tình huống A-G
6. C commit FinanceService + hardening
```

## Nguồn copy file

| File đích (repo mới) | Nguồn (repo cũ `D:\FW\FW\BaseCore\`) |
|---|---|
| `docs/1-mo-ta-de-tai.md` | `docs/1-mo-ta-de-tai.md` |
| `docs/2-yeu-cau-chuc-nang.md` | `docs/2-yeu-cau-chuc-nang.md` |
| `docs/3-thiet-ke-he-thong.md` | `docs/3-thiet-ke-he-thong.md` |
| `docs/4-huong-dan-cai-dat.md` | `docs/4-huong-dan-cai-dat.md` |
| `docs/5-phan-cong-nhom.md` | `docs/5-phan-cong-nhom.md` |
| `docs/internal/event-registration-flow.md` | `Context/VolunteerHub-event-registration-participation-flow-spec.md` |
| `docs/internal/sponsorship-donation-flow.md` | `Context/VolunteerHub-sponsorship-donation-flow-spec.md` |
| `docs/internal/real-world-scenarios.md` | `Context/VolunteerHub-real-world-scenarios.md` |
| `docs/internal/demo-workflow.md` | `Context/VolunteerHub-demo-workflow.md` |
| `.gitignore` | `.gitignore` |
| `README.md` | `README.md` (sửa link repo) |
| `seed_data.sql` | `seed_data.sql` |
| `BaseCore.sln` | `BaseCore.sln` |
| Tất cả project folder | Copy nguyên, trừ `bin/`, `obj/`, `node_modules/`, `*.log` |

## Checklist cuối cùng trước khi nộp

- [ ] Repo có commit từ cả 3 account GitHub
- [ ] Commit trải đều 6 tuần (không dồn hết 1 ngày)
- [ ] `docs/` có đủ 5 file + `internal/` có flow spec
- [ ] `dotnet build BaseCore.sln` pass
- [ ] `npm run build` (trong BaseCore.WebClient) pass
- [ ] README có hướng dẫn chạy
- [ ] Có 6 biên bản họp trong `Thực tập nhóm/`
- [ ] Có báo cáo + slide
- [ ] Trello board có card + assign + trạng thái Done
- [ ] Mỗi người hiểu phần mình, demo được, giải thích được
