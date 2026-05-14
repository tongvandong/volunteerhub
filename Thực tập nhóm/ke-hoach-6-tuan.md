# Kế hoạch thực tập nhóm 6 tuần — VolunteerHub

## Thông tin chung

- **Đề tài**: Website Volunteer Hub — Cổng sự kiện tình nguyện
- **Nhóm**: 3 người
- **Công nghệ**: .NET 8 (backend microservice), React/Vite (frontend), SQL Server, Ocelot API Gateway
- **Repository**: https://github.com/taoladong/volunteerhub
- **Trello**: (tạo board và paste link vào đây)

---

## Tuần 1 — Khởi động & Phân tích yêu cầu

### Mục tiêu
- Xác định bài toán, đối tượng người dùng, phạm vi hệ thống.
- Liệt kê yêu cầu chức năng và phi chức năng.
- Phân công sơ bộ.

### Công việc

| Việc | Người | Output |
|---|---|---|
| Viết mô tả bài toán (bối cảnh, tầm nhìn, mục tiêu) | Cả nhóm | File `Context/VolunteerHub-description.md` |
| Xác định 4 actor (Volunteer, Organizer, Sponsor, Admin) | Cả nhóm | Trong file mô tả |
| Liệt kê yêu cầu chức năng (FR-01 đến FR-23) | Chia 3 | File `Context/VolunteerHub-requirements-spec.md` |
| Liệt kê yêu cầu phi chức năng | Cả nhóm | Trong file requirements |
| Setup GitHub repo, tạo .gitignore, README | Trưởng nhóm | Repo trên GitHub |
| Setup Trello board, tạo card cho từng tuần | Trưởng nhóm | Link Trello |
| Họp nhóm lần 1 | Cả nhóm | Biên bản tuần 1 |

### Biên bản tuần 1 (gợi ý nội dung)

```
Ngày: ...
Thành phần: A, B, C
Nội dung:
1. Thống nhất đề tài: Website quản lý hoạt động tình nguyện
2. Xác định 4 vai trò người dùng
3. Phân chia phân tích yêu cầu:
   - A: phân hệ Identity/Profile/KYC
   - B: phân hệ Event/Registration/Attendance
   - C: phân hệ Finance/Sponsorship
4. Deadline tuần 1: hoàn thành file mô tả + requirements
Kết luận: Mỗi người viết phần yêu cầu của mình, tổng hợp cuối tuần.
```

### Commit gợi ý
```
docs: add project description and problem statement
docs: add functional requirements FR-01 to FR-23
docs: add non-functional requirements
chore: initial project setup with .gitignore and README
```

---

## Tuần 2 — Thiết kế hệ thống & Kiến trúc

### Mục tiêu
- Thiết kế kiến trúc microservice.
- Thiết kế database (entity, quan hệ).
- Thiết kế API contract.
- Phân công chi tiết cho giai đoạn code.

### Công việc

| Việc | Người | Output |
|---|---|---|
| Vẽ sơ đồ kiến trúc (Gateway, AuthService, EventService, FinanceService) | A | Ảnh/diagram trong báo cáo |
| Thiết kế entity/database (User, Event, Registration, Certificate, SupportCampaign, SponsorshipProposal...) | Cả nhóm | File entity `.cs` hoặc diagram |
| Thiết kế API contract (endpoint, method, request/response) | Chia 3 theo phân hệ | File README-nghiep-vu.md trong mỗi controller folder |
| Thiết kế luồng nghiệp vụ chính (event lifecycle, registration flow, finance flow) | Chia 3 | File spec trong Context/ |
| Tạo solution .NET, tạo project structure | Trưởng nhóm | BaseCore.sln + các project |
| Họp nhóm lần 2 | Cả nhóm | Biên bản tuần 2 |

### Biên bản tuần 2 (gợi ý)

```
Ngày: ...
Thành phần: A, B, C
Nội dung:
1. Review yêu cầu đã viết tuần 1
2. Thống nhất kiến trúc: 4 service + 1 gateway + 1 frontend
3. Thống nhất database: dùng chung 1 DB, EF Core migration
4. Phân công code:
   - A: AuthService, Identity controllers, Profile, KYC
   - B: EventService, Event/Registration/Attendance/Certificate controllers
   - C: FinanceService, Donation/Sponsorship controllers
5. Thống nhất port: Gateway 5000, Auth 5002, Event 5003, Finance 5004
Kết luận: Bắt đầu code từ tuần 3. Mỗi người tạo branch riêng.
```

### Commit gợi ý
```
chore: create solution structure with shared layers
feat(entities): add User, Event, Registration, Certificate entities
feat(entities): add SupportCampaign, SponsorshipProposal, Rating entities
docs: add event registration flow spec
docs: add sponsorship donation flow spec
docs: add team service split guide
feat(db): add MySqlDbContext with all entity configurations
feat(db): add initial migration and seed data
```

---

## Tuần 3 — Triển khai backend (phần 1)

### Mục tiêu
- Hoàn thành các API cốt lõi cho mỗi phân hệ.
- Mỗi người code phần mình, push lên branch riêng.

### Công việc

| Việc | Người | Output |
|---|---|---|
| Auth: đăng ký, đăng nhập, JWT, refresh token | A | AuthController hoạt động |
| Profile: CRUD hồ sơ, kỹ năng, KYC submit | A | ProfileController hoạt động |
| Event: CRUD event, approve/reject, complete | B | EventsController hoạt động |
| Registration: đăng ký, rút, confirm, cancel, check-in | B | RegistrationsController hoạt động |
| Finance: CRUD campaign, donation, confirm/reject | C | SupportCampaignController hoạt động |
| Sponsorship: proposal offer/request, accept/reject/received | C | SponsorshipProposalController hoạt động |
| Gateway: cấu hình Ocelot routing | Trưởng nhóm | ocelot.json + Gateway chạy được |
| Họp nhóm lần 3 | Cả nhóm | Biên bản tuần 3 |

### Biên bản tuần 3 (gợi ý)

```
Ngày: ...
Thành phần: A, B, C
Nội dung:
1. A demo: login/register qua Swagger, profile update, KYC submit
2. B demo: tạo event, admin approve, volunteer đăng ký, organizer confirm
3. C demo: tạo campaign, volunteer donate, organizer confirm donation
4. Vấn đề gặp: (ghi lại nếu có bug/conflict)
5. Kế hoạch tuần 4: hoàn thiện frontend + tình huống nâng cao
Kết luận: Backend cơ bản hoạt động. Tuần 4 làm frontend + hardening.
```

### Commit gợi ý (mỗi người trên branch riêng)
```
feat(auth): implement login, register, JWT token
feat(identity): add profile CRUD and KYC submission
feat(events): implement event CRUD with approve/reject/complete
feat(registration): add register, withdraw, confirm, cancel, check-in
feat(finance): implement support campaign and donation workflow
feat(sponsorship): add proposal offer, accept, reject, received, report
feat(gateway): configure Ocelot routing for all services
```

---

## Tuần 4 — Triển khai frontend + Tình huống nâng cao

### Mục tiêu
- Hoàn thành giao diện React cho các flow chính.
- Thêm xử lý tình huống thực tế (cancel event, walk-in, rating moderation...).
- Merge code của 3 người.

### Công việc

| Việc | Người | Output |
|---|---|---|
| Frontend: Landing, Event list/detail, Login/Register | B hoặc cả nhóm | Các page public hoạt động |
| Frontend: Dashboard, MyEvents, ManageEvent, EventForm | B | Organizer flow hoạt động |
| Frontend: MyRegistrations, Profile, Passport, Certificates | A | Volunteer flow hoạt động |
| Frontend: MySponsorships, Donation UI | C | Sponsor flow hoạt động |
| Frontend: Admin pages (events, users, categories, export) | Chia 3 | Admin flow hoạt động |
| Backend: thêm cancel event, resubmit, walk-in, manual-attend | B | Endpoint mới hoạt động |
| Backend: thêm rating moderation, uncomplete, auto-complete | B + Admin | Endpoint mới hoạt động |
| Backend: thêm ActualReceivedAmount, overspend guard | C | Finance hardening |
| Merge tất cả branch vào main | Trưởng nhóm | Main chạy được đầy đủ |
| Họp nhóm lần 4 | Cả nhóm | Biên bản tuần 4 |

### Biên bản tuần 4 (gợi ý)

```
Ngày: ...
Thành phần: A, B, C
Nội dung:
1. Demo frontend: mỗi người show màn hình phần mình
2. Merge code: giải quyết conflict ở api.js, App.jsx
3. Test 1 vòng demo workflow qua browser
4. Phát hiện bug: (liệt kê)
5. Kế hoạch tuần 5: fix bug + test kỹ + viết báo cáo
Kết luận: Hệ thống chạy được end-to-end. Cần fix bug và viết báo cáo.
```

### Commit gợi ý
```
feat(ui): add landing page, event list, event detail
feat(ui): add organizer pages (create, manage, my-events)
feat(ui): add volunteer pages (registrations, profile, certificates)
feat(ui): add sponsor pages (my-sponsorships, donation)
feat(ui): add admin pages (events, users, categories, export)
feat: add event cancel, resubmit, walk-in, manual-attend endpoints
feat: add rating moderation and admin uncomplete
feat: add ActualReceivedAmount and overspend guard
feat: split backend into EventService and FinanceService
```

---

## Tuần 5 — Test & Fix bug & Viết báo cáo

### Mục tiêu
- Test toàn bộ flow theo demo workflow.
- Fix bug phát sinh.
- Bắt đầu viết báo cáo theo mẫu.

### Công việc

| Việc | Người | Output |
|---|---|---|
| Chạy demo workflow đầy đủ (theo `VolunteerHub-demo-workflow.md`) | Cả nhóm | Checklist pass/fail |
| Test tình huống A-G (theo `VolunteerHub-real-world-scenarios.md`) | Chia 3 | Ghi nhận kết quả |
| Fix bug phát sinh | Người phụ trách phần đó | Commit fix |
| Test mobile viewport các màn chính | Cả nhóm | Screenshot |
| Viết báo cáo mục 1-4 (giới thiệu, tổ chức, kế hoạch, quá trình) | A | File báo cáo draft |
| Viết báo cáo mục 5-6 (kết quả, khó khăn) | B | Bổ sung vào báo cáo |
| Viết báo cáo mục 7-9 (đánh giá, kết luận, phụ lục) | C | Bổ sung vào báo cáo |
| Họp nhóm lần 5 | Cả nhóm | Biên bản tuần 5 |

### Biên bản tuần 5 (gợi ý)

```
Ngày: ...
Thành phần: A, B, C
Nội dung:
1. Kết quả test: X/Y flow pass, bug còn lại: (liệt kê)
2. Fix bug: đã fix (liệt kê commit)
3. Tiến độ báo cáo: A xong mục 1-4, B đang mục 5, C đang mục 7
4. Phân công slide: A làm slide 1-7, B làm slide 8-14, C làm slide 15-20
Kết luận: Hệ thống ổn định. Tuần 6 hoàn thiện báo cáo + slide + tập demo.
```

---

## Tuần 6 — Hoàn thiện báo cáo & Demo

### Mục tiêu
- Hoàn thiện báo cáo cuối cùng.
- Làm slide thuyết trình.
- Tập demo + thuyết trình.
- Nộp bài.

### Công việc

| Việc | Người | Output |
|---|---|---|
| Review + hoàn thiện báo cáo | Cả nhóm | File báo cáo final |
| Làm slide (15-20 slide) | Chia 3 | File slide |
| Tập thuyết trình (mỗi người trình bày phần mình) | Cả nhóm | Mỗi người nói được 5-7 phút |
| Chạy demo cuối cùng, chụp screenshot | Cả nhóm | Screenshot/video |
| Tổng hợp biên bản 6 tuần | Thư ký | Folder biên bản |
| Đánh giá chéo | Cả nhóm | Bảng đánh giá |
| Nộp lên GitHub + Drive | Trưởng nhóm | Link nộp |
| Họp nhóm lần 6 | Cả nhóm | Biên bản tuần 6 |

---

## Cấu trúc nộp bài gợi ý

```
GitHub repo:
├── BaseCore.sln (solution)
├── BaseCore.AuthService/
├── BaseCore.EventService/
├── BaseCore.FinanceService/
├── BaseCore.ApiGateway/
├── BaseCore.WebClient/
├── BaseCore.Entities/
├── BaseCore.Repository/
├── BaseCore.Services/
├── Context/ (tài liệu phân tích, spec, flow)
├── README.md (hướng dẫn chạy)
└── Thực tập nhóm/
    ├── Bao_cao_tong_hop.docx
    ├── Slide_thuyet_trinh.pptx
    ├── Bien_ban_tuan_1.docx
    ├── Bien_ban_tuan_2.docx
    ├── Bien_ban_tuan_3.docx
    ├── Bien_ban_tuan_4.docx
    ├── Bien_ban_tuan_5.docx
    ├── Bien_ban_tuan_6.docx
    └── Danh_gia_cheo.xlsx

Google Drive (backup):
├── Báo cáo
├── Slide
├── Biên bản
├── Screenshot demo
└── Video demo (nếu có)
```

---

## Lưu ý chiến lược

1. **Git history**: Mỗi người cần có commit riêng, đều đặn qua các tuần. Nếu code đã có sẵn, có thể tạo branch mới từ empty, commit từng phần theo đúng timeline.

2. **Trello**: Tạo board ngay tuần 1. Mỗi tuần có list riêng. Move card khi xong. Giảng viên có thể kiểm tra.

3. **Biên bản**: Viết ngắn gọn nhưng phải có mỗi tuần. Dùng đúng format mẫu đã cho.

4. **Mỗi người phải hiểu phần mình**: Khi thuyết trình, giảng viên có thể hỏi bất kỳ ai về bất kỳ phần nào. Đảm bảo mỗi người ít nhất demo được phần mình code.

5. **Không cần hoàn hảo**: Giảng viên đánh giá quy trình làm việc nhóm + sản phẩm chạy được + mỗi người đóng góp. Không cần 100% feature, nhưng cần chạy được và giải thích được.
