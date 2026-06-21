# Kế hoạch thực tập nhóm - VolunteerHub

## 1. Thông tin chung

- **Môn học**: Thực tập nhóm
- **Giảng viên**: Phan Nguyên Hải
- **Lớp**: CNTT59
- **Đề tài**: VolunteerHub - Cổng sự kiện tình nguyện
- **Source hoàn thiện**: `D:\FW\FW\BaseCore`
- **Repo nộp bài**: `https://github.com/taoladong/volunteerhub2026_TTN`
- **Repo local dự kiến**: `D:\FW\FW\volunteerhub2026_TTN`
- **Trello**: `https://trello.com/b/q3SPEszi/b%E1%BA%A3ng-trello-c%E1%BB%A7a-toi`
- **Google Drive**: `https://drive.google.com/drive/u/0/folders/1qnu4XJEBNgHDcGQzNKacwwpaZxygxAdZ`

Kế hoạch có hai lớp:

- **Lịch kỹ thuật 2 tuần / 14 ngày**: dùng để clone repo, copy dần source từ `BaseCore`, commit/push theo nhánh riêng và hoàn thiện bộ nộp.
- **Trello và biên bản 6 tuần**: dùng để đáp ứng yêu cầu môn Thực tập nhóm, thể hiện tiến trình từ phân tích đến nộp bài.

Nhóm làm trên 3 máy, nên `master` chỉ là nhánh tích hợp; mỗi thành viên làm trên nhánh riêng, push nhánh cá nhân, tạo Pull Request hoặc nhờ người tích hợp merge về `master`. Commit dùng ngày hiện tại khi thực hiện, không backdate.

## 1.1. Quy ước nhánh

| Thành viên | Nhánh làm việc | Khi nào merge |
|---|---|---|
| Tống Văn Đông | `feature/events-dong` | Merge sau các mốc nền repo, event, gateway, frontend event/organizer, tài liệu tổng |
| Phạm Tiến Dũng | `feature/auth-verification-dung` | Merge sau khi auth/profile/verification và auth UI ổn |
| Hồ Sỹ Vinh | `feature/finance-donation-vinh` | Merge sau khi finance/donation/sponsor và sponsor UI ổn |
| Cả nhóm | `docs/final-submission` | Dùng cho báo cáo, slide, biên bản, đánh giá chéo ở ngày 13-14 |

Trước mỗi ngày làm việc: pull `master`, merge `master` vào nhánh cá nhân, làm phần của mình, commit, push nhánh cá nhân, cập nhật Trello. Không force push lên `master`.

Quy ước commit: dùng prefix ngắn để phân loại (`docs:`, `feat(events):`, `feat(auth):`, `feat(finance):`, `feat(ui):`, `fix:`, `test:`), nhưng phần mô tả viết bằng tiếng Việt không dấu để dễ đọc trên GitHub và tránh lỗi encoding.

Quy ước Trello: tên card và comment chính viết bằng tiếng Việt; chỉ giữ thuật ngữ kỹ thuật khi cần như `backend`, `frontend`, `API`, `build`, `deploy`, `VietQR`, `GitHub`, `Drive`.

## 2. Phân công nhóm

| Thành viên | Vai trò | Phạm vi phụ trách |
|---|---|---|
| Tống Văn Đông | Nhóm trưởng | Luồng sự kiện, event lifecycle, registration, work shift, check-in, certificate, gateway/service coordination, tổng hợp báo cáo |
| Phạm Tiến Dũng | Thành viên | Auth, profile, organizer/volunteer verification, RBAC, session/auth-aware layout |
| Hồ Sỹ Vinh | Thành viên | Ủng hộ, đóng góp, sponsor, finance, donor stats, campaign bank info, VietQR/bank info |

## 3. Source hiện tại cần phản ánh

Source `BaseCore` hiện đã có nhiều phần mới so với kế hoạch cũ, khi copy sang repo nộp bài và viết báo cáo phải ghi nhận đúng:

- **Interview scheduling**: `InterviewSlot`, `InterviewService`, `IInterviewService`, `InterviewCallController`, API đặt lịch/cập nhật/hủy/chấm kết quả phỏng vấn trước khi xác nhận đăng ký.
- **Event hardening**: `MinParticipants`, kiểm tra GPS/QR, cửa sổ điểm danh, self check-in, tính giờ tình nguyện thực tế, event visibility theo thời gian/trạng thái.
- **Finance improvements**: campaign bank info, donor stats, donation-based badge, public donor/confirmed amount, `ActualReceivedAmount`, admin finance watch, VietQR helper.
- **Organizer identity**: organizer logo, verification preview, reject reason, audit trail.
- **UI restructure**: volunteer `Home`, `Activity`, `Profile`, `Achievements`; organizer `ManageEvent/` dạng folder/tabs; admin `AdminCatalog`, `AdminVerifications`, `AdminFinanceWatch`; shared UI như `EmptyState`, `Tabs`, `MobileActionBar`, `ProgressMeter`.
- **Layout/auth-aware**: `SharedLayout`, role-aware nav, account dropdown, notification badge, session verify bằng `authApi.me`.
- **Test/docs**: `docs/kich-ban-nghiep-vu-thuc-te.md`, `docs/kich-ban-test-nghiep-vu.md`, `TestResults/manual-critical/`, `artifacts/`.

## 4. Lịch Trello và họp nhóm 6 tuần

Trello và biên bản được tổ chức theo 6 tuần:

| Tuần | Trọng tâm | Họp nhóm | Output |
|---|---|---|---|
| Tuần 1 | Khởi động, phân tích yêu cầu, tạo repo/branch | Họp tuần 1 - Kickoff và phân tích | Mô tả đề tài, yêu cầu, phân công, biên bản tuần 1 |
| Tuần 2 | Thiết kế hệ thống, database, API/service | Họp tuần 2 - Thiết kế và phân chia backend | Thiết kế hệ thống, entity/schema, biên bản tuần 2 |
| Tuần 3 | Backend auth/event/finance, gateway/service split | Họp tuần 3 - Demo backend | API/backend chính, biên bản tuần 3 |
| Tuần 4 | Frontend public/volunteer/organizer/admin/sponsor | Họp tuần 4 - Demo frontend | UI chính, biên bản tuần 4 |
| Tuần 5 | Build/test, fix bug, tài liệu kỹ thuật | Họp tuần 5 - Test và fix bug | Test docs, README/setup guide, biên bản tuần 5 |
| Tuần 6 | Báo cáo, slide, demo cuối, nộp bài | Họp tuần 6 - Chốt nộp bài | Báo cáo, slide, đánh giá chéo, biên bản tuần 6 |

Sau mỗi buổi họp phải cập nhật Trello card họp, ghi kết luận và cập nhật file biên bản trong `Thực tập nhóm/`.

## 5. Lịch kỹ thuật 14 ngày

### Ngày 1 - Khởi tạo repo nộp bài

**Mục tiêu**: Clone repo mới, kiểm tra nhánh hiện có, tạo cấu trúc ban đầu.

| Việc | Người phụ trách | Output |
|---|---|---|
| Clone `volunteerhub2026_TTN` ngang hàng `BaseCore` | Tống Văn Đông | `D:\FW\FW\volunteerhub2026_TTN` |
| Kiểm tra nhánh `master`, `dung` và nội dung sẵn có | Tống Văn Đông | Ghi chú tình trạng repo trước khi copy |
| Tạo nhánh `feature/events-dong`, `feature/auth-verification-dung`, `feature/finance-donation-vinh` | Cả nhóm | Mỗi người có nhánh làm việc riêng |
| Tạo cấu trúc `docs/`, `docs/internal/`, `Context/`, `Thực tập nhóm/` | Tống Văn Đông | Folder nền |
| Cập nhật `.gitignore`, README giới thiệu ngắn | Tống Văn Đông | Repo sạch, không track `bin/`, `obj/`, `node_modules/` |

Commit gợi ý:

```text
chore: khoi tao repo nop bai VolunteerHub
```

### Ngày 2 - Tài liệu phân tích và phân công

**Mục tiêu**: Đưa tài liệu phân tích vào repo mới và chỉnh theo thông tin nhóm thật.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy/cập nhật `docs/1-mo-ta-de-tai.md` | Tống Văn Đông | Mô tả đề tài |
| Copy/cập nhật `docs/2-yeu-cau-chuc-nang.md` | Cả nhóm | Yêu cầu chức năng/phi chức năng |
| Copy/cập nhật `docs/5-phan-cong-nhom.md` | Tống Văn Đông | Phân công Đông/Dũng/Vinh |
| Bổ sung link GitHub, Trello, Drive | Tống Văn Đông | Tài liệu đúng công cụ nộp bài |

Commit gợi ý:

```text
docs: them tong quan yeu cau va phan cong nhom
```

### Ngày 3 - Solution nền và database

**Mục tiêu**: Copy nền backend dùng chung.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy `BaseCore.sln`, `BaseCore.Common`, `BaseCore.DTO`, `BaseCore.Libs` | Tống Văn Đông | Solution mở được |
| Copy `BaseCore.Entities`, `BaseCore.Repository` | Tống Văn Đông | Entity, DbContext, repository |
| Copy migration nền và seed data | Cả nhóm rà soát | Database schema/seed |
| Kiểm tra entity theo từng luồng | Đông/Dũng/Vinh | Không thiếu entity auth/event/finance |

Commit gợi ý:

```text
feat: them cau truc solution repository va du lieu mau
```

### Ngày 4 - Auth, profile, verification

**Mục tiêu**: Copy và kiểm tra luồng xác thực.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy `BaseCore.AuthService` | Phạm Tiến Dũng | Login/register/JWT |
| Copy `Controllers/Identity`, `Services/Authen` | Phạm Tiến Dũng | Profile/verification/RBAC |
| Copy migration và entity verification liên quan | Phạm Tiến Dũng | Organizer/volunteer verification |
| Đông hỗ trợ route/gateway nếu cần | Tống Văn Đông | Auth flow qua gateway |

Commit gợi ý:

```text
feat(auth): them luong dang nhap ho so va xac minh
```

### Ngày 5 - Event lifecycle

**Mục tiêu**: Copy luồng sự kiện cốt lõi.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy `Controllers/Events` | Tống Văn Đông | Event/registration/work shift/certificate API |
| Copy `Services/VolunteerHub/Events` | Tống Văn Đông | EventService, RegistrationService, CertificateService |
| Copy rule hardening: min participants, visibility, GPS/QR, self check-in | Tống Văn Đông | Nghiệp vụ event đúng source |
| Dũng/Vinh rà quyền và liên kết finance-event | Phạm Tiến Dũng, Hồ Sỹ Vinh | Không sai role/sponsor |

Commit gợi ý:

```text
feat(events): them luong su kien dang ky diem danh va chung chi
```

### Ngày 6 - Finance, donation, sponsor

**Mục tiêu**: Copy luồng ủng hộ/đóng góp.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy `Controllers/Finance` | Hồ Sỹ Vinh | Support campaign, donation, sponsorship |
| Copy entity/migration finance mới | Hồ Sỹ Vinh | Campaign bank info, donor stats |
| Copy admin finance watch logic | Hồ Sỹ Vinh | Monitoring tài chính |
| Copy VietQR helper ở frontend khi đến phần UI | Hồ Sỹ Vinh | QR chuyển khoản |

Commit gợi ý:

```text
feat(finance): them luong ung ho tai tro va dong gop
```

### Ngày 7 - APIService, Gateway, service split, backend build

**Mục tiêu**: Hoàn thiện backend chạy được.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy `BaseCore.APIService`, `BaseCore.ApiGateway` | Tống Văn Đông | Core API + Ocelot gateway |
| Copy `BaseCore.EventService`, `BaseCore.FinanceService` | Tống Văn Đông | Service split |
| Copy DI/config cho interview, finance, notification | Cả nhóm | Không thiếu service registration |
| Chạy `dotnet restore` và `dotnet build BaseCore.sln` | Tống Văn Đông | Backend build pass hoặc có log lỗi cần sửa |

Commit gợi ý:

```text
feat: them gateway tach service va cau hinh backend
fix: sua loi build backend
```

### Ngày 8 - Frontend foundation

**Mục tiêu**: Copy nền React/Vite.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy `BaseCore.WebClient/package*.json`, Vite/Tailwind config | Tống Văn Đông | Frontend install/build được |
| Copy `App.jsx`, layouts, `AuthContext`, `api.js` | Tống Văn Đông, Phạm Tiến Dũng | Routing/auth-aware layout |
| Copy shared UI components mới | Tống Văn Đông | UI foundation |
| Kiểm tra `SharedLayout`, `roleNav`, `format` | Phạm Tiến Dũng | Role navigation đúng |

Commit gợi ý:

```text
feat(ui): them nen tang frontend React Vite
```

### Ngày 9 - Public, auth, volunteer UI

**Mục tiêu**: Copy giao diện khách, auth và volunteer.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy landing, event list/detail, public profile | Tống Văn Đông | Public flow |
| Copy login/register/profile/verification | Phạm Tiến Dũng | Auth UI |
| Copy volunteer Home/Activity/Profile/Achievements, passport, registrations, certificates | Tống Văn Đông, Phạm Tiến Dũng | Volunteer flow |
| Kiểm tra responsive và tiếng Việt | Cả nhóm | Không lỗi font/mojibake |

Commit gợi ý:

```text
feat(ui): them giao dien public auth va tinh nguyen vien
```

### Ngày 10 - Organizer, admin, sponsor UI

**Mục tiêu**: Copy giao diện vận hành.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy organizer MyEvents, EventForm, ManageEvent folder, OrganizerInsights | Tống Văn Đông | Organizer flow |
| Copy admin users/events/catalog/verifications/finance watch/monitoring | Phạm Tiến Dũng, Hồ Sỹ Vinh | Admin flow |
| Copy sponsor profile, MySponsorships, MyDonations | Hồ Sỹ Vinh | Sponsor/finance UI |
| Copy `vietqr.js`, public assets/logo | Hồ Sỹ Vinh | QR/bank UI |

Commit gợi ý:

```text
feat(ui): them giao dien organizer admin va sponsor
```

### Ngày 11 - Test, build, kịch bản nghiệp vụ

**Mục tiêu**: Kiểm thử build và bổ sung test docs.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy `tests/e2e`, Playwright config, helper | Tống Văn Đông | E2E test source |
| Copy `docs/kich-ban-test-nghiep-vu.md` và `docs/kich-ban-nghiep-vu-thuc-te.md` | Cả nhóm | Test checklist |
| Chạy `npm install`, `npm run build` | Tống Văn Đông | Frontend build pass hoặc log lỗi |
| Fix lỗi copy thiếu theo luồng | Đông/Dũng/Vinh | Commit fix theo owner |

Commit gợi ý:

```text
test: them test nghiep vu e2e va luong demo
fix(ui): sua loi build frontend
```

### Ngày 12 - Hoàn thiện tài liệu kỹ thuật

**Mục tiêu**: Tài liệu repo đủ để người khác chạy và hiểu project.

| Việc | Người phụ trách | Output |
|---|---|---|
| Copy/cập nhật `docs/3-thiet-ke-he-thong.md` | Tống Văn Đông | Kiến trúc và database |
| Copy/cập nhật `docs/4-huong-dan-cai-dat.md` | Tống Văn Đông | Hướng dẫn local |
| Copy docs/internal plan mới cần thiết | Cả nhóm | Interview/donation/admin/organizer/volunteer/layout plans |
| Cập nhật README với link repo/Trello/Drive | Tống Văn Đông | README cuối |

Commit gợi ý:

```text
docs: hoan thien huong dan cai dat thiet ke va kiem thu
```

### Ngày 13 - Báo cáo, biên bản, đánh giá chéo

**Mục tiêu**: Chuẩn bị bộ tài liệu môn học.

| Việc | Người phụ trách | Output |
|---|---|---|
| Viết báo cáo tổng hợp theo mẫu | Tống Văn Đông tổng hợp | `Bao_cao_tong_hop_VolunteerHub.docx` |
| Bổ sung phần auth/verification | Phạm Tiến Dũng | Nội dung báo cáo |
| Bổ sung phần finance/donation | Hồ Sỹ Vinh | Nội dung báo cáo |
| Tạo biên bản họp và đánh giá chéo | Cả nhóm | `Bien_ban_*.docx`, đánh giá chéo |

Commit gợi ý:

```text
docs: them bao cao bien ban va danh gia cheo
```

### Ngày 14 - Slide, demo, nộp bài

**Mục tiêu**: Chốt toàn bộ.

| Việc | Người phụ trách | Output |
|---|---|---|
| Làm slide 15-20 trang | Cả nhóm | `Slide_thuyet_trinh_VolunteerHub.pptx` |
| Chạy demo cuối: auth, event, finance | Đông/Dũng/Vinh theo luồng | Demo pass |
| Upload Drive: báo cáo, slide, biên bản, screenshot | Tống Văn Đông | Drive cập nhật |
| Tạo PR `docs/final-submission` vào `master`, kéo Trello card sang Done | Tống Văn Đông | Repo sẵn sàng nộp |

Commit gợi ý:

```text
docs: them slide va chot bo nop bai
```

## 6. Checklist cuối

- [ ] Repo mới clone ở `D:\FW\FW\volunteerhub2026_TTN`.
- [ ] Mỗi thành viên làm trên nhánh riêng, không commit thẳng vào `master` hằng ngày.
- [ ] Các PR/merge về `master` được thực hiện sau khi review/build phù hợp.
- [ ] Không commit `bin/`, `obj/`, `node_modules/`, `.vs`, log/cache.
- [ ] `dotnet build BaseCore.sln` pass hoặc có ghi chú lỗi môi trường.
- [ ] `npm run build` trong `BaseCore.WebClient` pass hoặc có ghi chú lỗi môi trường.
- [ ] README có hướng dẫn chạy và tài khoản demo.
- [ ] `docs/` có đủ tài liệu mô tả, yêu cầu, thiết kế, cài đặt, phân công, test.
- [ ] `Thực tập nhóm/` có báo cáo, slide, biên bản, đánh giá chéo.
- [ ] Trello có card theo 6 tuần, trạng thái cập nhật.
- [ ] 6 biên bản họp tuần đã có nội dung.
- [ ] Drive có bản cuối của báo cáo/slide/biên bản/screenshot.
