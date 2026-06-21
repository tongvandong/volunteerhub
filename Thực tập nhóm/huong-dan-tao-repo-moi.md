# Hướng dẫn tạo repo mới và commit theo timeline 2 tuần

## 1. Mục tiêu

Dựng repo nộp bài `volunteerhub2026_TTN` từ source hoàn thiện `BaseCore`, theo tiến độ kỹ thuật 2 tuần. Vì nhóm làm trên **3 máy**, không làm trực tiếp trên `master` hằng ngày. Mỗi người làm trên nhánh riêng, push nhánh của mình lên GitHub, sau đó tạo Pull Request hoặc nhờ người tích hợp merge về `master`.

Lưu ý: Trello và biên bản vẫn tổ chức theo **6 tuần** để đáp ứng yêu cầu môn Thực tập nhóm. Lịch 14 ngày dưới đây chỉ là lịch copy/commit kỹ thuật.

- **Source hiện tại**: `D:\FW\FW\BaseCore`
- **Repo mới local**: `D:\FW\FW\volunteerhub2026_TTN`
- **GitHub**: `https://github.com/taoladong/volunteerhub2026_TTN`
- **Trello**: `https://trello.com/b/q3SPEszi/b%E1%BA%A3ng-trello-c%E1%BB%A7a-toi`
- **Google Drive**: `https://drive.google.com/drive/u/0/folders/1qnu4XJEBNgHDcGQzNKacwwpaZxygxAdZ`

Commit theo ngày hiện tại khi thực hiện, không chỉnh ngày commit quá khứ. Commit message viết bằng tiếng Việt không dấu; vẫn giữ prefix ngắn để phân loại, ví dụ `feat(events): them luong su kien`.

Tên card Trello và ghi chú tiến độ ưu tiên tiếng Việt; chỉ giữ nguyên thuật ngữ kỹ thuật cần thiết như `backend`, `frontend`, `API`, `build`, `deploy`, `VietQR`, `GitHub`, `Drive`.

## 2. Branch workflow

`master` là nhánh tích hợp cuối. Mỗi thành viên làm trên nhánh riêng:

| Thành viên | Nhánh làm việc | Phạm vi chính |
|---|---|---|
| Tống Văn Đông | `feature/events-dong` | Repo/main coordination, event lifecycle, gateway/service split, public/organizer UI, tổng hợp báo cáo |
| Phạm Tiến Dũng | `feature/auth-verification-dung` | Auth, profile, organizer/volunteer verification, RBAC, auth UI |
| Hồ Sỹ Vinh | `feature/finance-donation-vinh` | Finance, donation, sponsor, donor stats, campaign bank info, VietQR |

Quy trình hằng ngày cho mỗi người:

```powershell
git switch master
git pull origin master

git switch feature/events-dong
git merge master

# copy/làm phần việc trong ngày
git status --short
git add .
git commit -m "feat(events): mo ta ngan gon bang tieng Viet"
git push origin feature/events-dong
```

Thay `feature/events-dong` bằng nhánh tương ứng của Dũng hoặc Vinh.

Sau khi push, tạo Pull Request từ nhánh cá nhân vào `master`. Chỉ merge khi:

- Phần việc đúng phạm vi.
- Không commit file output nặng hoặc file rác.
- Build/test liên quan pass hoặc có ghi chú lỗi môi trường.
- Trello card đã cập nhật.

## 3. Chuẩn bị repo

### 3.1 Clone repo

```powershell
cd D:\FW\FW
git clone https://github.com/taoladong/volunteerhub2026_TTN.git volunteerhub2026_TTN
cd volunteerhub2026_TTN
```

### 3.2 Kiểm tra nhánh có sẵn

Repo remote hiện có ít nhất nhánh `master` và `dung`. Trước khi copy file, phải kiểm tra nội dung:

```powershell
git fetch origin
git branch -a
git status --short --branch
git log --oneline --decorate -n 20
```

Nếu cần xem nhánh `dung`:

```powershell
git switch dung
git status --short --branch
git log --oneline --decorate -n 10
git switch master
```

Không xóa hoặc ghi đè nội dung cũ nếu chưa thống nhất. Mặc định giữ file hợp lệ và copy bổ sung theo kế hoạch.

### 3.3 Tạo nhánh cá nhân

Tống Văn Đông:

```powershell
git switch master
git pull origin master
git switch -c feature/events-dong
git push -u origin feature/events-dong
```

Phạm Tiến Dũng:

```powershell
git switch master
git pull origin master
git switch -c feature/auth-verification-dung
git push -u origin feature/auth-verification-dung
```

Hồ Sỹ Vinh:

```powershell
git switch master
git pull origin master
git switch -c feature/finance-donation-vinh
git push -u origin feature/finance-donation-vinh
```

## 4. Cấu trúc repo đích

```text
volunteerhub2026_TTN/
├── docs/
├── docs/internal/
├── Context/
├── Thực tập nhóm/
├── BaseCore.sln
├── BaseCore.ApiGateway/
├── BaseCore.APIService/
├── BaseCore.AuthService/
├── BaseCore.EventService/
├── BaseCore.FinanceService/
├── BaseCore.Common/
├── BaseCore.DTO/
├── BaseCore.Entities/
├── BaseCore.Repository/
├── BaseCore.Services/
├── BaseCore.Libs/
├── BaseCore.WebClient/
├── scripts/
├── seed_data.sql
├── README.md
└── .gitignore
```

Không commit:

```text
bin/
obj/
node_modules/
dist/
.vs/
*.log
```

`TestResults/manual-critical/` hoặc `artifacts/` chỉ copy nếu dùng làm minh chứng nộp bài và đã lọc file nặng.

## 5. Lịch copy và nhánh phụ trách

### Ngày 1 - Khởi tạo repo

**Owner**: Tống Văn Đông  
**Nhánh**: `feature/events-dong`, merge về `master` sau khi tạo nền.

Copy/tạo:

- `.gitignore`
- README bản đầu
- Folder `docs`, `docs/internal`, `Context`, `Thực tập nhóm`

Commit:

```powershell
git add .
git commit -m "chore: khoi tao repo nop bai VolunteerHub"
git push origin feature/events-dong
```

Tạo PR vào `master`. Sau khi merge, Dũng và Vinh pull `master` mới rồi tiếp tục từ nhánh của mình.

### Ngày 2 - Tài liệu phân tích

**Owner**: Cả nhóm  
**Nhánh**:

- Đông: `feature/events-dong`
- Dũng: `feature/auth-verification-dung`
- Vinh: `feature/finance-donation-vinh`

Copy/cập nhật:

- `docs/1-mo-ta-de-tai.md`
- `docs/2-yeu-cau-chuc-nang.md`
- `docs/5-phan-cong-nhom.md`
- `Context/VolunteerHub-description.md`
- `Context/VolunteerHub-requirements-spec.md`

Phân chia:

- Đông: mô tả đề tài, event requirements, phân công nhóm.
- Dũng: auth/profile/verification/RBAC requirements.
- Vinh: finance/donation/sponsor requirements.

Commit gợi ý:

```text
docs: them tong quan de tai va yeu cau su kien
docs(auth): them yeu cau dang nhap va xac minh
docs(finance): them yeu cau ung ho va tai tro
```

### Ngày 3 - Solution nền và database

**Owner**: Tống Văn Đông  
**Nhánh**: `feature/events-dong`

Copy:

- `BaseCore.sln`
- `BaseCore.Common/`
- `BaseCore.DTO/`
- `BaseCore.Entities/`
- `BaseCore.Repository/`
- `BaseCore.Libs/`
- `seed_data.sql`
- `scripts/reset-demo-data.ps1`
- `scripts/reset-demo-data.sql`

Bao gồm migration/entity mới:

- `InterviewSlot`
- `AddInterviewSlot`
- `AddCampaignBankInfo`
- `AddDonorStats`
- `AddOrganizerLogo`
- `MySqlDbContextModelSnapshot`
- `DesignTimeDbContextFactory`

Commit:

```powershell
git add BaseCore.sln BaseCore.Common BaseCore.DTO BaseCore.Entities BaseCore.Repository BaseCore.Libs seed_data.sql scripts
git commit -m "feat: them cau truc solution repository va du lieu mau"
git push origin feature/events-dong
```

### Ngày 4 - Auth, profile, verification

**Owner**: Phạm Tiến Dũng  
**Nhánh**: `feature/auth-verification-dung`

Copy:

- `BaseCore.AuthService/`
- `BaseCore.APIService/Controllers/Identity/`
- `BaseCore.Services/Authen/`
- Entity/migration liên quan `OrganizerVerification`, `VolunteerProfile`, verification fields.

Commit:

```powershell
git add BaseCore.AuthService BaseCore.APIService/Controllers/Identity BaseCore.Services/Authen BaseCore.Entities BaseCore.Repository/Migrations
git commit -m "feat(auth): them luong dang nhap ho so va xac minh"
git push origin feature/auth-verification-dung
```

### Ngày 5 - Event lifecycle và interview

**Owner**: Tống Văn Đông  
**Nhánh**: `feature/events-dong`

Copy:

- `BaseCore.APIService/Controllers/Events/`
- `BaseCore.APIService/Controllers/Shared/RatingsController.cs`
- `BaseCore.Services/VolunteerHub/Events/`
- `BaseCore.Services/VolunteerHub/Engagement/`
- Event/registration/certificate/badge entities liên quan.

Đảm bảo có:

- `InterviewCallController.cs`
- `InterviewSlot.cs`
- `IInterviewService.cs`
- `InterviewService.cs`
- API đặt lịch/cập nhật/hủy/chấm kết quả phỏng vấn.
- `RequiresInterview`, `InterviewStatus`, `InterviewSlot`.
- QR/GPS check-in window, self check-in, actual volunteer hours.
- `MinParticipants`, event visibility.

Commit:

```powershell
git add BaseCore.APIService/Controllers/Events BaseCore.APIService/Controllers/Shared BaseCore.Services/VolunteerHub/Events BaseCore.Services/VolunteerHub/Engagement BaseCore.Entities BaseCore.Repository
git commit -m "feat(events): them luong su kien phong van diem danh va chung chi"
git push origin feature/events-dong
```

### Ngày 6 - Finance, donation, sponsor

**Owner**: Hồ Sỹ Vinh  
**Nhánh**: `feature/finance-donation-vinh`

Copy:

- `BaseCore.APIService/Controllers/Finance/`
- `BaseCore.APIService/Controllers/Admin/AdminFinanceController.cs`
- Finance-related services/entities/migrations.
- `SupportCampaign`, `IndividualDonation`, `SponsorProfile`, `SponsorshipProposal`.

Đảm bảo có:

- Campaign bank info.
- Donor stats.
- Donation-based badge condition.
- Public donor/confirmed amount.
- `ActualReceivedAmount`.
- Admin finance watch.

Commit:

```powershell
git add BaseCore.APIService/Controllers/Finance BaseCore.APIService/Controllers/Admin BaseCore.Entities BaseCore.Repository BaseCore.Services
git commit -m "feat(finance): them ung ho tai tro thong ke donor va thong tin ngan hang"
git push origin feature/finance-donation-vinh
```

### Ngày 7 - Tích hợp backend

**Owner chính**: Tống Văn Đông  
**Nhánh tích hợp**: `feature/events-dong`, sau đó PR vào `master`

Trước khi tích hợp, Đông pull/merge các nhánh của Dũng và Vinh hoặc merge PR theo thứ tự:

1. `feature/auth-verification-dung`
2. `feature/events-dong`
3. `feature/finance-donation-vinh`

Copy/bổ sung:

- `BaseCore.APIService/`
- `BaseCore.ApiGateway/`
- `BaseCore.EventService/`
- `BaseCore.FinanceService/`

Kiểm tra DI/config cho auth, event, interview, finance, notification, SignalR channel notifier.

Build:

```powershell
dotnet restore BaseCore.sln
dotnet build BaseCore.sln
```

Commit:

```powershell
git add BaseCore.APIService BaseCore.ApiGateway BaseCore.EventService BaseCore.FinanceService BaseCore.sln
git commit -m "feat: them gateway tach service va cau hinh backend"
git push origin feature/events-dong
```

Nếu build lỗi do thiếu file:

```powershell
git add .
git commit -m "fix: sua loi build backend"
git push origin feature/events-dong
```

### Ngày 8 - Frontend foundation

**Owner**: Tống Văn Đông + Phạm Tiến Dũng  
**Nhánh**: Đông làm layout/app trên `feature/events-dong`, Dũng làm auth context nếu cần trên `feature/auth-verification-dung`.

Copy:

- `BaseCore.WebClient/package*.json`
- `BaseCore.WebClient/vite.config.js`
- `BaseCore.WebClient/tailwind.config.js`
- `BaseCore.WebClient/postcss.config.js`
- `BaseCore.WebClient/index.html`
- `BaseCore.WebClient/src/main.jsx`
- `BaseCore.WebClient/src/App.jsx`
- `BaseCore.WebClient/src/contexts/AuthContext.jsx`
- `BaseCore.WebClient/src/services/api.js`
- `BaseCore.WebClient/src/components/layouts/`
- `BaseCore.WebClient/src/components/ui/`
- `BaseCore.WebClient/src/utils/roleNav.js`
- `BaseCore.WebClient/src/utils/format.js`

Commit gợi ý:

```text
feat(ui): them nen tang React Vite va layout dung chung
feat(auth): noi AuthContext va dieu huong theo vai tro
```

### Ngày 9 - Public, auth, volunteer UI

**Owner**: Tống Văn Đông + Phạm Tiến Dũng  
**Nhánh**:

- Đông: `feature/events-dong`
- Dũng: `feature/auth-verification-dung`

Copy:

- Public pages: Đông.
- Auth pages: Dũng.
- Volunteer pages: Đông/Dũng theo phần profile/verification.
- `PublicProfile.jsx`, `Channel.jsx` nếu có.

Commit gợi ý:

```text
feat(ui): them luong public su kien va tinh nguyen vien
feat(auth): them trang dang nhap dang ky ho so va xac minh
```

### Ngày 10 - Organizer, admin, sponsor UI

**Owner**: Tống Văn Đông + Hồ Sỹ Vinh  
**Nhánh**:

- Đông: `feature/events-dong`
- Vinh: `feature/finance-donation-vinh`

Copy:

- Organizer pages và `ManageEvent/`: Đông.
- Admin event/users/catalog/verifications: Đông/Dũng nếu liên quan.
- Admin finance watch, sponsor pages, `vietqr.js`: Vinh.
- `BaseCore.WebClient/public/` nếu có ảnh/logo/asset cần thiết.

Commit gợi ý:

```text
feat(ui): them quan ly su kien organizer va luong admin
feat(finance): them giao dien tai tro ung ho va VietQR
```

### Ngày 11 - Test và kịch bản nghiệp vụ

**Owner**: Cả nhóm  
**Nhánh**: mỗi người commit test docs/bugfix liên quan trên nhánh của mình.

Copy:

- `BaseCore.WebClient/playwright.config.js`
- `BaseCore.WebClient/tests/e2e/`
- `docs/kich-ban-test-nghiep-vu.md`
- `docs/kich-ban-nghiep-vu-thuc-te.md`
- `TestResults/manual-critical/` nếu cần minh chứng nhẹ.
- `artifacts/` nếu có ảnh/screenshot demo cần nộp.

Build:

```powershell
cd D:\FW\FW\volunteerhub2026_TTN\BaseCore.WebClient
npm install
npm run build

cd D:\FW\FW\volunteerhub2026_TTN
dotnet build BaseCore.sln
```

Commit gợi ý:

```text
test: them test e2e va tai lieu kiem thu thu cong
fix(ui): sua loi build frontend
fix(events): sua loi tich hop luong su kien
fix(finance): sua loi tich hop luong ung ho
```

### Ngày 12 - Hoàn thiện tài liệu kỹ thuật

**Owner chính**: Tống Văn Đông  
**Nhánh**: `feature/events-dong` hoặc nhánh riêng `docs/final-documentation`

Copy/cập nhật:

- `docs/3-thiet-ke-he-thong.md`
- `docs/4-huong-dan-cai-dat.md`
- `docs/internal/interview-scheduling-plan.md`
- `docs/internal/donation-improvements-plan.md`
- `docs/internal/admin-restructure-plan.md`
- `docs/internal/organizer-redesign-plan.md`
- `docs/internal/volunteer-ui-redesign-plan.md`
- `docs/internal/layout-consistency-plan.md`
- `docs/internal/public-events-redesign-plan.md`
- `docs/internal/landing-redesign-plan.md`
- `docs/internal/channel-enhancement-plan.md`
- `docs/internal/fix-blind-approval-plan.md`
- `docs/internal/remove-milestone-plan.md`
- `docs/sponsor-ui-improvement-plan.md`
- `README.md`

Commit:

```powershell
git add README.md docs
git commit -m "docs: hoan thien cai dat thiet ke va ghi chu trien khai"
git push origin feature/events-dong
```

### Ngày 13 - Báo cáo, biên bản, đánh giá chéo

**Owner**: Cả nhóm  
**Nhánh**: nên dùng `docs/final-submission` để tránh đụng code.

Tạo nhánh:

```powershell
git switch master
git pull origin master
git switch -c docs/final-submission
git push -u origin docs/final-submission
```

Tạo/cập nhật trong `Thực tập nhóm/`:

- `Bao_cao_tong_hop_VolunteerHub.docx`
- Biên bản theo mốc họp hoặc theo tuần/ngày.
- `Danh_gia_cheo.xlsx` hoặc bảng đánh giá chéo trong báo cáo.
- Các file markdown nền: kế hoạch, biên bản, Trello checklist, hướng dẫn repo.

Commit:

```powershell
git add "Thực tập nhóm"
git commit -m "docs: them bao cao bien ban va danh gia cheo"
git push origin docs/final-submission
```

### Ngày 14 - Slide, demo cuối, nộp bài

**Owner**: Cả nhóm  
**Nhánh**: `docs/final-submission`, merge về `master` sau review cuối.

Tạo/cập nhật:

- `Thực tập nhóm/Slide_thuyet_trinh_VolunteerHub.pptx`
- Screenshot demo nếu có.
- README/checklist nộp bài.

Kiểm tra cuối:

```powershell
dotnet build BaseCore.sln
cd BaseCore.WebClient
npm run build
```

Commit:

```powershell
git add .
git commit -m "docs: them slide va chot bo nop bai"
git push origin docs/final-submission
```

Tạo PR `docs/final-submission` vào `master`. Sau khi merge, upload Drive và kéo toàn bộ Trello card sang `Done`.

## 6. Quy tắc tránh conflict

- Luôn `git pull origin master` và merge `master` vào nhánh cá nhân trước khi bắt đầu ngày mới.
- Không sửa file ngoài phạm vi nếu không cần.
- Các file dễ conflict cần báo trước trong nhóm:
  - `BaseCore.sln`
  - `BaseCore.APIService/Program.cs`
  - `BaseCore.EventService/Program.cs`
  - `BaseCore.FinanceService/Program.cs`
  - `BaseCore.WebClient/src/App.jsx`
  - `BaseCore.WebClient/src/services/api.js`
  - `BaseCore.WebClient/package.json`
  - `README.md`
- Nếu một file có nhiều người cần sửa, ưu tiên Đông tích hợp sau khi Dũng/Vinh đã push phần riêng.
- Không dùng `git reset --hard`, không force push lên `master`.

## 7. Checklist cuối ngày

- [ ] Đang ở đúng nhánh cá nhân.
- [ ] Đã merge `master` mới nhất vào nhánh cá nhân trước khi làm.
- [ ] Đã copy file từ `D:\FW\FW\BaseCore` sang repo mới.
- [ ] Đã kiểm tra build/test phù hợp với phần việc.
- [ ] Đã commit với message rõ ràng.
- [ ] Đã push nhánh cá nhân lên GitHub.
- [ ] Đã tạo/cập nhật Pull Request nếu cần merge về `master`.
- [ ] Nếu có tài liệu, đã upload/cập nhật Drive.
- [ ] Nếu ngày đó có họp nhóm, đã cập nhật card họp, comment kết luận và biên bản.
- [ ] Đã cập nhật checklist/comment trên Trello.

## 8. Checklist họp nhóm

Trello cần có 6 card họp nhóm:

1. `Họp tuần 1 - Kickoff và phân tích`
2. `Họp tuần 2 - Thiết kế hệ thống`
3. `Họp tuần 3 - Demo backend`
4. `Họp tuần 4 - Demo frontend`
5. `Họp tuần 5 - Test và fix bug`
6. `Họp tuần 6 - Chốt báo cáo, slide và nộp bài`

Mỗi card họp cần tick:

- [ ] Có đủ thành viên tham gia hoặc ghi rõ người vắng.
- [ ] Có nội dung họp.
- [ ] Có kết luận.
- [ ] Có phân công việc tiếp theo.
- [ ] Đã cập nhật biên bản/nhật ký họp.
- [ ] Đã upload Drive nếu có file minh chứng.

## 9. Checklist cuối cùng

- [ ] Repo mới nằm ngang hàng `BaseCore`, không làm thay đổi source `BaseCore` khi dựng bài.
- [ ] Đã inspect nhánh `master` và `dung` trước khi copy.
- [ ] Mỗi thành viên có commit trên nhánh riêng.
- [ ] 6 card họp nhóm đã hoàn tất trên Trello.
- [ ] Các nhánh `feature/events-dong`, `feature/auth-verification-dung`, `feature/finance-donation-vinh` đã được merge/review hợp lý.
- [ ] Trello có card theo 6 tuần, assign đúng Đông/Dũng/Vinh.
- [ ] Drive có báo cáo, slide, biên bản, screenshot/video demo nếu có.
- [ ] Backend build pass hoặc ghi rõ lỗi môi trường.
- [ ] Frontend build pass hoặc ghi rõ lỗi môi trường.
- [ ] README có hướng dẫn chạy, port, tài khoản demo.
- [ ] Tài liệu phản ánh đúng source hiện tại: interview scheduling, donor stats, bank info/VietQR, organizer logo, UI restructure, layout auth-aware, test docs mới.
- [ ] Không còn thông tin repo cũ trong tài liệu nộp.
- [ ] Không ghi số nhóm trong tài liệu nộp.
