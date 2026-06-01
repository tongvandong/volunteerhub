# Biên bản họp nhóm 6 tuần - VolunteerHub

File này dùng làm nội dung nền để chuyển sang các file `.docx` theo mẫu biên bản trong thư mục `Thực tập nhóm`. Dù phần copy/commit kỹ thuật có thể làm trong 2 tuần, biên bản vẫn thể hiện tiến trình 6 tuần theo yêu cầu môn học.

## Thông tin chung

- **Môn học**: Thực tập nhóm
- **Giảng viên**: Phan Nguyên Hải
- **Lớp**: CNTT59
- **Đề tài**: VolunteerHub
- **GitHub**: `https://github.com/taoladong/volunteerhub2026_TTN`
- **Trello**: `https://trello.com/b/q3SPEszi/b%E1%BA%A3ng-trello-c%E1%BB%A7a-toi`
- **Google Drive**: `https://drive.google.com/drive/u/0/folders/1qnu4XJEBNgHDcGQzNKacwwpaZxygxAdZ`

## Thành phần nhóm

| Thành viên | Vai trò | Phụ trách |
|---|---|---|
| Tống Văn Đông | Nhóm trưởng | Luồng sự kiện, event lifecycle, registration, check-in, certificate, gateway/service coordination |
| Phạm Tiến Dũng | Thành viên | Auth, profile, organizer/volunteer verification, RBAC |
| Hồ Sỹ Vinh | Thành viên | Ủng hộ, đóng góp, sponsor, finance, donor stats, VietQR/bank info |

## Biên bản tuần 1 - Khởi động và phân tích yêu cầu

**Thành phần**: Tống Văn Đông, Phạm Tiến Dũng, Hồ Sỹ Vinh

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Thống nhất đề tài | Chọn VolunteerHub - Cổng sự kiện tình nguyện |
| 2 | Thống nhất công cụ | GitHub quản lý source, Trello quản lý tiến độ, Drive lưu tài liệu nộp |
| 3 | Thống nhất branch workflow | Đông dùng `feature/events-dong`, Dũng dùng `feature/auth-verification-dung`, Vinh dùng `feature/finance-donation-vinh` |
| 4 | Phân tích người dùng | Guest, Volunteer, Organizer, Sponsor, Admin |
| 5 | Phân công yêu cầu | Đông phụ trách event; Dũng phụ trách auth/verification; Vinh phụ trách finance/donation |

**Kết luận**: Nhóm thống nhất đề tài, công cụ, phân công và bắt đầu chuẩn bị tài liệu yêu cầu.

## Biên bản tuần 2 - Thiết kế hệ thống

**Thành phần**: Tống Văn Đông, Phạm Tiến Dũng, Hồ Sỹ Vinh

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Review yêu cầu chức năng | Các luồng auth, event, finance đã được phân chia rõ |
| 2 | Thống nhất kiến trúc | .NET 8 backend, React/Vite frontend, SQL Server, API Gateway, service split |
| 3 | Thiết kế database | Dùng Entities, Repository, EF Core migrations và seed data |
| 4 | Thiết kế schema theo luồng | Dũng rà User/Profile/Verification; Đông rà Event/Registration/Interview; Vinh rà Campaign/Donation/Sponsor |
| 5 | Kế hoạch code | Mỗi người copy và commit phần của mình trên nhánh riêng |

**Kết luận**: Thiết kế hệ thống và database được thống nhất, sẵn sàng triển khai backend.

## Biên bản tuần 3 - Triển khai backend

**Thành phần**: Tống Văn Đông, Phạm Tiến Dũng, Hồ Sỹ Vinh

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Dũng demo auth/verification | Login/register, JWT, profile, organizer/volunteer verification, RBAC |
| 2 | Đông demo event backend | Event CRUD, registration, work shift, QR/GPS check-in, certificate |
| 3 | Đông bổ sung interview scheduling | `InterviewSlot`, `InterviewService`, đặt lịch/cập nhật/hủy/chấm kết quả phỏng vấn |
| 4 | Vinh demo finance backend | Support campaign, donation, sponsorship proposal, donor stats, campaign bank info |
| 5 | Tích hợp service | APIService, AuthService, EventService, FinanceService, ApiGateway dùng chung SQL Server |

**Kết luận**: Backend chính đã có đủ các luồng nghiệp vụ. Nhóm chuyển sang frontend và kiểm thử tích hợp.

## Biên bản tuần 4 - Triển khai frontend

**Thành phần**: Tống Văn Đông, Phạm Tiến Dũng, Hồ Sỹ Vinh

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Frontend foundation | React/Vite, routing, layouts, AuthContext, API service, shared UI |
| 2 | Public/volunteer UI | Landing, EventList, EventDetail, Home, Activity, Profile, Achievements |
| 3 | Auth/verification UI | Login, Register, profile, organizer/volunteer verification |
| 4 | Organizer/admin UI | MyEvents, EventForm, ManageEvent folder/tabs, AdminCatalog, AdminVerifications |
| 5 | Sponsor/finance UI | SponsorProfile, MySponsorships, MyDonations, AdminFinanceWatch, VietQR helper |
| 6 | Layout/auth-aware | `SharedLayout`, role-aware nav, account dropdown, session verify bằng `authApi.me` |

**Kết luận**: Frontend đã bám theo source hiện tại và đủ màn hình cho demo từng vai trò.

## Biên bản tuần 5 - Test và fix bug

**Thành phần**: Tống Văn Đông, Phạm Tiến Dũng, Hồ Sỹ Vinh

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Build backend | Chạy `dotnet restore` và `dotnet build`, ghi nhận lỗi môi trường nếu có |
| 2 | Build frontend | Chạy `npm install` và `npm run build`, kiểm tra import/asset/UI |
| 3 | Test auth/verification | Dũng kiểm tra login/register, role guard, verification approve/reject |
| 4 | Test event/interview/check-in | Đông kiểm tra tạo event, duyệt, đăng ký, phỏng vấn, QR/GPS check-in, certificate |
| 5 | Test finance/donation | Vinh kiểm tra donation, sponsorship, received amount, donor stats, VietQR/bank info |
| 6 | Cập nhật tài liệu kỹ thuật | README, hướng dẫn cài đặt, kịch bản test, demo workflow |

**Kết luận**: Nhóm hoàn thiện kiểm thử và chuẩn bị nội dung báo cáo/slide.

## Biên bản tuần 6 - Báo cáo, slide và nộp bài

**Thành phần**: Tống Văn Đông, Phạm Tiến Dũng, Hồ Sỹ Vinh

| STT | Nội dung | Kết luận |
|---|---|---|
| 1 | Review báo cáo | Báo cáo tổng hợp đủ giới thiệu, phân công, kế hoạch, quá trình, kết quả, khó khăn, đánh giá, kết luận, phụ lục |
| 2 | Review slide | Slide 15-20 trang, chia phần trình bày theo Đông/Dũng/Vinh |
| 3 | Demo cuối | Đông demo event; Dũng demo auth/verification; Vinh demo finance/donation |
| 4 | Đánh giá chéo | Mỗi thành viên tự đánh giá và đánh giá hai thành viên còn lại |
| 5 | Nộp bài | Push GitHub, cập nhật Trello, upload Drive, chuẩn bị link nộp |

**Kết luận**: Hoàn thành bộ nộp môn Thực tập nhóm, sẵn sàng thuyết trình.

## Nhật ký kỹ thuật 14 ngày

Phần này chỉ dùng để theo dõi quá trình copy/commit thực tế, không thay thế biên bản 6 tuần.

| Ngày | Người phụ trách chính | Tiến độ |
|---|---|---|
| Ngày 1 | Tống Văn Đông | Clone repo, kiểm tra `master`/`dung`, tạo nhánh cá nhân, tạo README/.gitignore/folder nền |
| Ngày 2 | Cả nhóm | Copy/cập nhật tài liệu mô tả đề tài, yêu cầu chức năng, phân công nhóm |
| Ngày 3 | Tống Văn Đông | Copy solution nền, entities, repository, migrations, seed data |
| Ngày 4 | Phạm Tiến Dũng | Copy AuthService, Identity controllers, Authen services, profile/verification |
| Ngày 5 | Tống Văn Đông | Copy Event controllers/services, registration, work shift, certificate, interview scheduling |
| Ngày 6 | Hồ Sỹ Vinh | Copy Finance controllers, support campaign, donation, sponsorship, donor stats |
| Ngày 7 | Tống Văn Đông | Copy APIService, ApiGateway, EventService, FinanceService, chạy backend build |
| Ngày 8 | Tống Văn Đông, Phạm Tiến Dũng | Copy frontend foundation, layouts, auth context, role nav, shared UI |
| Ngày 9 | Tống Văn Đông, Phạm Tiến Dũng | Copy public/auth/volunteer pages, kiểm tra responsive |
| Ngày 10 | Tống Văn Đông, Hồ Sỹ Vinh | Copy organizer/admin/sponsor pages, VietQR helper, assets |
| Ngày 11 | Cả nhóm | Copy test docs, E2E source, chạy build/test và fix lỗi |
| Ngày 12 | Tống Văn Đông | Hoàn thiện README, thiết kế hệ thống, hướng dẫn cài đặt, docs/internal |
| Ngày 13 | Cả nhóm | Viết báo cáo, biên bản, đánh giá chéo; upload Drive draft |
| Ngày 14 | Cả nhóm | Làm slide, chạy demo cuối, upload Drive, merge PR cuối |

## Lưu ý khi chuyển sang DOCX

- Dùng đúng mẫu biên bản đã có trong thư mục `Thực tập nhóm`.
- Không ghi số nhóm.
- Giữ tên đầy đủ của 3 thành viên.
- Mỗi biên bản nên ngắn gọn, 1-2 trang là đủ.
- Nội dung phải thống nhất với báo cáo, slide, Trello và repo GitHub.
