# Trello card list - VolunteerHub theo 6 tuần

Board Trello: `https://trello.com/b/q3SPEszi/b%E1%BA%A3ng-trello-c%E1%BB%A7a-toi`

## 1. Nguyên tắc

Kế hoạch copy/commit kỹ thuật có thể thực hiện trong 2 tuần, nhưng Trello phục vụ môn Thực tập nhóm cần thể hiện tiến trình 6 tuần: phân tích, thiết kế, backend, frontend, test, báo cáo/nộp bài.

Board dùng 3 list đơn giản:

1. `To Do`
2. `Doing`
3. `Done`

Khi bắt đầu làm card thì kéo sang `Doing`. Khi đã hoàn thành phần việc, push nhánh cá nhân/PR nếu cần, cập nhật Drive nếu có và comment kết quả thì kéo sang `Done`.

## 2. Nhánh làm việc

- Tống Văn Đông: `feature/events-dong`
- Phạm Tiến Dũng: `feature/auth-verification-dung`
- Hồ Sỹ Vinh: `feature/finance-donation-vinh`
- Báo cáo/slide cuối: `docs/final-submission`

Commit message dùng tiếng Việt không dấu, ví dụ: `feat(events): them luong su kien dang ky diem danh`.

Tên card Trello ưu tiên tiếng Việt để giảng viên và các thành viên đọc nhanh tiến độ. Chỉ giữ nguyên thuật ngữ kỹ thuật quen thuộc khi cần, ví dụ `backend`, `frontend`, `API`, `build`, `deploy`, `VietQR`, `GitHub`, `Drive`.

## 3. Label gợi ý

- `docs` - tài liệu
- `backend` - backend .NET
- `frontend` - frontend React/Vite
- `database` - entity, migration, seed
- `test` - kiểm thử
- `meeting` - họp nhóm/biên bản
- `submission` - báo cáo, slide, Drive

## 4. Card theo 6 tuần

### Tuần 1 - Khởi động và phân tích yêu cầu

| Card | Assign | Checklist |
|---|---|---|
| [Tuần 1] Tạo repo, nhánh làm việc và cấu trúc ban đầu | Tống Văn Đông | Clone repo; inspect `master`/`dung`; tạo 3 nhánh cá nhân; thêm README/.gitignore; tạo folder `docs`, `Context`, `Thực tập nhóm`; push `feature/events-dong` |
| [Tuần 1] Viết mô tả đề tài VolunteerHub | Tống Văn Đông | Bối cảnh; mục tiêu; phạm vi; actor; link GitHub/Trello/Drive |
| [Tuần 1] Viết yêu cầu xác thực, hồ sơ và xác minh | Phạm Tiến Dũng | Register/login; JWT; profile; organizer verification; volunteer verification; RBAC |
| [Tuần 1] Viết yêu cầu sự kiện, đăng ký và điểm danh | Tống Văn Đông | Event CRUD; registration; interview scheduling; work shift; QR/GPS check-in; certificate |
| [Tuần 1] Viết yêu cầu tài chính, ủng hộ và tài trợ | Hồ Sỹ Vinh | Campaign; donation; sponsorship; donor stats; bank info; VietQR; admin finance watch |
| [Tuần 1] Họp khởi động và phân tích | Cả nhóm | Thống nhất đề tài; phân công; branch workflow; công cụ; cập nhật biên bản tuần 1 |

### Tuần 2 - Thiết kế hệ thống và database

| Card | Assign | Checklist |
|---|---|---|
| [Tuần 2] Sao chép solution nền và lớp dùng chung | Tống Văn Đông | `BaseCore.sln`; Common; DTO; Libs; cấu trúc project |
| [Tuần 2] Thiết kế entity/database chung | Tống Văn Đông | Entities; Repository; DbContext; migrations; seed data |
| [Tuần 2] Thiết kế dữ liệu xác thực và xác minh | Phạm Tiến Dũng | User; VolunteerProfile; OrganizerVerification; auth tokens; verification fields |
| [Tuần 2] Thiết kế dữ liệu sự kiện và phỏng vấn | Tống Văn Đông | Event; Registration; WorkShift; Certificate; InterviewSlot; EventCategory |
| [Tuần 2] Thiết kế dữ liệu tài chính | Hồ Sỹ Vinh | SupportCampaign; IndividualDonation; SponsorProfile; SponsorshipProposal; donor stats |
| [Tuần 2] Họp thiết kế và phân chia backend | Cả nhóm | Review architecture; thống nhất API/service; cập nhật biên bản tuần 2 |

### Tuần 3 - Triển khai backend chính

| Card | Assign | Checklist |
|---|---|---|
| [Tuần 3] Triển khai dịch vụ xác thực và controller định danh | Phạm Tiến Dũng | AuthService; login/register; ProfileController; OrganizerVerificationController; RBAC |
| [Tuần 3] Triển khai API sự kiện và service liên quan | Tống Văn Đông | EventsController; RegistrationsController; WorkShiftsController; EventService; RegistrationService |
| [Tuần 3] Triển khai lịch phỏng vấn | Tống Văn Đông | InterviewSlot; InterviewService; InterviewCallController; notification; confirm gate |
| [Tuần 3] Triển khai API tài chính và service liên quan | Hồ Sỹ Vinh | SupportCampaignController; SponsorshipProposalController; SponsorProfile; donation status |
| [Tuần 3] Tích hợp APIService, Gateway, EventService, FinanceService | Tống Văn Đông | DI/config; Ocelot; service split; backend build |
| [Tuần 3] Họp demo backend | Cả nhóm | Dũng demo auth; Đông demo event/interview; Vinh demo donation/sponsor; cập nhật biên bản tuần 3 |

### Tuần 4 - Triển khai frontend và UI

| Card | Assign | Checklist |
|---|---|---|
| [Tuần 4] Sao chép nền tảng frontend | Tống Văn Đông, Phạm Tiến Dũng | React/Vite; App; layouts; AuthContext; api.js; shared UI |
| [Tuần 4] Triển khai giao diện công khai và tình nguyện viên | Tống Văn Đông, Phạm Tiến Dũng | Landing; EventList; EventDetail; Home; Activity; Profile; Achievements |
| [Tuần 4] Triển khai giao diện xác thực và xác minh | Phạm Tiến Dũng | Login; Register; profile; organizer verification; volunteer verification |
| [Tuần 4] Triển khai giao diện ban tổ chức và quản trị | Tống Văn Đông | MyEvents; EventForm; ManageEvent folder/tabs; AdminEvents; AdminCatalog; AdminVerifications |
| [Tuần 4] Triển khai giao diện tài trợ và tài chính | Hồ Sỹ Vinh | SponsorProfile; MySponsorships; MyDonations; VietQR helper; AdminFinanceWatch |
| [Tuần 4] Họp demo frontend | Cả nhóm | Review UI từng role; ghi bug; cập nhật biên bản tuần 4 |

### Tuần 5 - Kiểm thử, fix bug, hoàn thiện tài liệu kỹ thuật

| Card | Assign | Checklist |
|---|---|---|
| [Tuần 5] Chạy backend build và rà lỗi tích hợp | Tống Văn Đông | `dotnet restore`; `dotnet build`; ghi lỗi môi trường nếu có |
| [Tuần 5] Chạy frontend build và rà lỗi giao diện | Tống Văn Đông, Phạm Tiến Dũng | `npm install`; `npm run build`; responsive; tiếng Việt |
| [Tuần 5] Kiểm thử xác thực, xác minh và phân quyền | Phạm Tiến Dũng | Login/register; role guard; verification approve/reject |
| [Tuần 5] Kiểm thử sự kiện, phỏng vấn, điểm danh và chứng chỉ | Tống Văn Đông | Create/approve event; registration; interview; QR/GPS check-in; complete; certificate |
| [Tuần 5] Kiểm thử ủng hộ, tài trợ và tài chính | Hồ Sỹ Vinh | Donate; sponsor proposal; received amount; donor stats; VietQR/bank info |
| [Tuần 5] Cập nhật README, hướng dẫn cài đặt và tài liệu kiểm thử | Cả nhóm | README; `docs/4-huong-dan-cai-dat.md`; test scenarios; demo workflow |
| [Tuần 5] Họp kiểm thử và sửa lỗi | Cả nhóm | Tổng hợp pass/fail; phân công fix; cập nhật biên bản tuần 5 |

### Tuần 6 - Báo cáo, slide, demo cuối và nộp bài

| Card | Assign | Checklist |
|---|---|---|
| [Tuần 6] Viết báo cáo tổng hợp | Tống Văn Đông | Tổng hợp 9 mục; chèn link GitHub/Trello/Drive; nhận phần auth/finance từ Dũng/Vinh |
| [Tuần 6] Bổ sung phần xác thực và xác minh vào báo cáo | Phạm Tiến Dũng | Mô tả luồng; hình/demo nếu có; khó khăn và bài học |
| [Tuần 6] Bổ sung phần tài chính và ủng hộ vào báo cáo | Hồ Sỹ Vinh | Mô tả luồng; donor stats; VietQR/bank info; khó khăn và bài học |
| [Tuần 6] Tạo biên bản họp 6 tuần | Cả nhóm | Tuần 1-6; đúng mẫu; không ghi số nhóm |
| [Tuần 6] Làm slide thuyết trình | Cả nhóm | 15-20 slide; chia phần Đông/Dũng/Vinh; demo flow |
| [Tuần 6] Đánh giá chéo và checklist nộp | Cả nhóm | Bảng đánh giá; kiểm tra repo; kiểm tra Drive; kiểm tra Trello |
| [Tuần 6] Họp chốt nộp bài | Cả nhóm | Demo cuối; kiểm tra build; upload Drive; merge PR cuối; cập nhật biên bản tuần 6 |

## 5. Checklist họp nhóm

Mỗi tuần có một card họp riêng. Card họp bắt đầu ở `To Do`, khi họp kéo sang `Doing`, sau khi cập nhật biên bản thì kéo sang `Done`.

Checklist cho mỗi card họp:

- [ ] Có đủ 3 thành viên hoặc ghi rõ người vắng.
- [ ] Có nội dung họp.
- [ ] Có kết luận.
- [ ] Có phân công việc tiếp theo.
- [ ] Đã cập nhật biên bản tuần tương ứng.
- [ ] Đã comment tóm tắt lên Trello.
- [ ] Đã upload Drive nếu có file DOCX/ảnh minh chứng.

## 6. Checklist cuối mỗi ngày làm việc

- [ ] Card Trello đúng owner và đang ở list đúng.
- [ ] Đang làm trên đúng nhánh cá nhân.
- [ ] Đã pull `master` mới nhất và merge vào nhánh cá nhân trước khi làm.
- [ ] File đã copy từ `D:\FW\FW\BaseCore` sang repo mới.
- [ ] Đã kiểm tra build/test phù hợp với phần việc.
- [ ] Đã commit với message tiếng Việt rõ ràng.
- [ ] Đã push nhánh cá nhân lên GitHub.
- [ ] Đã tạo/cập nhật Pull Request nếu cần merge vào `master`.
- [ ] Nếu có tài liệu, đã upload/cập nhật Drive.
- [ ] Nếu có họp, đã cập nhật card họp và biên bản.
- [ ] Đã ghi chú lỗi còn lại hoặc việc chuyển sang ngày sau.

## 7. Checklist trước khi nộp

- [ ] Tất cả card công việc 6 tuần đã ở `Done`.
- [ ] 6 card họp nhóm đã ở `Done`.
- [ ] Repo GitHub có source, docs, báo cáo/slide/biên bản.
- [ ] Mỗi người có commit trên nhánh riêng.
- [ ] Các PR chính đã merge về `master`.
- [ ] README có hướng dẫn chạy và tài khoản demo.
- [ ] Trello thể hiện đủ phân công Đông/Dũng/Vinh.
- [ ] Drive có báo cáo, slide, biên bản, screenshot/video demo nếu có.
- [ ] Mỗi thành viên nắm được phần demo của mình.
