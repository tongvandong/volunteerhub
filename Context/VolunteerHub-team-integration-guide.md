# Volunteer Hub - Hướng dẫn chia việc và tích hợp nhóm

Tài liệu này dùng để chia công việc cho nhóm 3 người khi phát triển Volunteer Hub. Hướng tiếp cận đề xuất là mỗi phần chính vẫn viết bằng C#/.NET để ổn định, nhưng có thể tích hợp module nhỏ bằng ngôn ngữ khác nếu môn học yêu cầu.

## 1. Chia nội dung làm việc

### Phần 1 - Identity / Profile / KYC

Người phụ trách: thành viên 1.

Mục tiêu: quản lý danh tính người dùng, vai trò, hồ sơ và xác minh.

Chức năng chính:

- Đăng ký, đăng nhập, JWT, role.
- Hồ sơ volunteer.
- Kỹ năng, ngôn ngữ, thông tin cá nhân.
- KYC volunteer: gửi hồ sơ, admin duyệt/từ chối, trạng thái verified.
- Xác minh organizer: thông tin pháp lý, admin duyệt/từ chối.
- Chặn organizer chưa verified tạo event.
- Cung cấp thông tin KYC/verification cho các phần khác kiểm tra điều kiện nghiệp vụ.

Công nghệ:

- Core service: C#/.NET.
- Không cần ngôn ngữ phụ trong giai đoạn đầu vì đây là phần nền tảng bảo mật.

Folder chính:

- `BaseCore.AuthService/`
- `BaseCore.Services/Authen/`
- `BaseCore.APIService/Controllers/Identity/`
- `BaseCore.WebClient/src/pages/auth/`
- `BaseCore.WebClient/src/pages/volunteer/MyProfile.jsx`
- `BaseCore.WebClient/src/pages/organizer/OrganizerVerification.jsx`
- `BaseCore.WebClient/src/pages/admin/AdminOrganizerVerifications.jsx`
- `BaseCore.WebClient/src/pages/admin/AdminVolunteerVerifications.jsx`

### Phần 2 - Event / Registration / Attendance

Người phụ trách: thành viên 2.

Mục tiêu: quản lý vòng đời sự kiện, đăng ký tham gia và điểm danh.

Chức năng chính:

- Organizer tạo/sửa event.
- Cấu hình event: địa điểm, thời gian, min/max volunteer, yêu cầu KYC.
- Admin duyệt/từ chối event.
- Volunteer xem event và đăng ký.
- Chặn volunteer chưa KYC nếu event yêu cầu KYC.
- Organizer confirm/reject volunteer.
- Điểm danh QR và điểm danh thủ công.
- Tính giờ tham gia.
- Cấp certificate sau khi volunteer hoàn thành sự kiện.

Công nghệ:

- Core service: C#/.NET.
- Module phụ để tích hợp ngôn ngữ khác: Rust Certificate Generator.

Module Rust đề xuất:

- Nhận dữ liệu certificate từ Event Service.
- Sinh mã chứng nhận.
- Tạo QR verify certificate.
- Render file PDF chứng nhận.
- Trả về đường dẫn file hoặc metadata cho Event Service lưu database.

Ví dụ kết nối nội bộ:

```text
Event Service C#
  POST http://localhost:5300/certificates/render
  -> Rust Certificate Generator
```

Folder chính:

- `BaseCore.APIService/Controllers/Events/`
- `BaseCore.Services/VolunteerHub/Events/`
- `BaseCore.Entities/Event.cs`
- `BaseCore.Entities/Registration.cs`
- `BaseCore.Entities/WorkShift.cs`
- `BaseCore.Entities/Certificate.cs`
- `BaseCore.WebClient/src/pages/public/EventList.jsx`
- `BaseCore.WebClient/src/pages/public/EventDetail.jsx`
- `BaseCore.WebClient/src/pages/organizer/EventForm.jsx`
- `BaseCore.WebClient/src/pages/organizer/ManageEvent.jsx`
- `BaseCore.WebClient/src/pages/admin/AdminEvents.jsx`
- `BaseCore.WebClient/src/pages/volunteer/MyRegistrations.jsx`

### Phần 3 - Donation / Sponsorship / Financial Report

Người phụ trách: thành viên 3.

Mục tiêu: quản lý ủng hộ cá nhân, tài trợ doanh nghiệp và báo cáo minh bạch tài chính.

Chức năng chính:

- Organizer tạo campaign kêu gọi ủng hộ cho event.
- Volunteer ủng hộ cá nhân vào campaign.
- Organizer confirm donation.
- Sponsor gửi đề nghị tài trợ event.
- Organizer accept/reject sponsorship proposal.
- Sponsor/organizer cập nhật trạng thái đã nhận.
- Tạo report sử dụng tài trợ.
- Tổng hợp báo cáo tài chính theo event.

Công nghệ:

- Core service: C#/.NET.
- Module phụ để tích hợp ngôn ngữ khác: Ruby Financial Report Renderer.

Module Ruby đề xuất:

- Nhận dữ liệu tài chính từ Finance Service.
- Render báo cáo HTML/PDF/CSV bằng template.
- Format bảng campaign, donation, sponsorship, tổng tiền đã xác nhận.
- Trả về đường dẫn report cho Finance Service lưu lại.

Ví dụ kết nối nội bộ:

```text
Finance Service C#
  POST http://localhost:5400/reports/financial-event
  -> Ruby Financial Report Renderer
```

Folder chính:

- `BaseCore.APIService/Controllers/Finance/`
- `BaseCore.Entities/SupportCampaign.cs`
- `BaseCore.Entities/IndividualDonation.cs`
- `BaseCore.Entities/SponsorshipProposal.cs`
- `BaseCore.Entities/EventSponsor.cs`
- `BaseCore.WebClient/src/pages/volunteer/MyDonations.jsx`
- `BaseCore.WebClient/src/pages/sponsor/MySponsorships.jsx`
- `BaseCore.WebClient/src/pages/admin/AdminExport.jsx`
- Các phần finance trong `BaseCore.WebClient/src/pages/public/EventDetail.jsx`
- Các phần campaign/sponsorship trong `BaseCore.WebClient/src/pages/organizer/ManageEvent.jsx`

## 2. Yêu cầu kết nối và đồng bộ

### Nguyên tắc kết nối

- Frontend nên gọi qua API Gateway hoặc API endpoint thống nhất, không gọi lung tung sang nhiều port nếu không cần.
- Các service trao đổi dữ liệu qua HTTP REST API.
- Request/response cần thống nhất schema trước khi code.
- Mỗi API nên trả về lỗi rõ ràng, có status code và message để frontend hiển thị.
- JWT/role phải được sử dụng nhất quán giữa các service.

### Đồng bộ Identity với Event

Event Service cần biết:

- Organizer hiện tại đã verified chưa.
- Volunteer hiện tại đã KYC verified chưa.
- User đang gọi API có role gì.

Luôn cần kiểm tra:

- Organizer chưa verified không được tạo event.
- Organizer chỉ được quản lý event của mình.
- Volunteer chưa KYC bị chặn nếu event yêu cầu KYC.
- Admin mới được duyệt/từ chối event.

### Đồng bộ Event với Finance

Finance Service cần biết:

- Event có tồn tại không.
- Event đã được duyệt chưa.
- Event thuộc organizer nào.
- Campaign/donation/sponsorship đang gắn vào event nào.

Luôn cần kiểm tra:

- Chỉ organizer của event mới được tạo campaign.
- Volunteer chỉ được ủng hộ vào campaign đang mở.
- Sponsor chỉ được xem và cập nhật proposal của mình.
- Organizer chỉ được accept/reject sponsorship proposal của event mình quản lý.

### Đồng bộ file và module phụ

Rust Certificate Generator:

- Input: thông tin volunteer, event, số giờ, mã certificate.
- Output: file PDF certificate, QR verify payload, metadata.
- Nếu Rust service lỗi, Event Service phải ghi lỗi và không làm mất dữ liệu attendance.

Ruby Financial Report Renderer:

- Input: thông tin event, campaigns, donations, sponsorships.
- Output: file report HTML/PDF/CSV hoặc report content.
- Nếu Ruby service lỗi, Finance Service vẫn giữ dữ liệu donation/sponsorship và cho phép render lại sau.

### Đồng bộ database

Giai đoạn đồ án nên dùng chung database để dễ tích hợp. Tuy nhiên mỗi người chỉ nên sửa entity/migration khi đã báo cả nhóm.

Vùng database dễ conflict:

- `BaseCore.Entities/`
- `BaseCore.Repository/MySqlDbContext.cs`
- `BaseCore.Repository/Migrations/`

Nên có một người phụ trách tổng hợp migration.

## 3. Tổng quan hệ thống sau khi hợp nhất

Kiến trúc tổng thể:

```text
React WebClient
  |
  v
API Gateway / API Endpoint
  |
  +-- Identity Service - C#/.NET
  |     +-- Auth, profile, KYC, organizer verification
  |
  +-- Event Service - C#/.NET
  |     +-- Event, registration, attendance
  |     +-- Rust Certificate Generator
  |
  +-- Finance Service - C#/.NET
        +-- Donation, sponsorship, financial report
        +-- Ruby Financial Report Renderer
```

Luồng demo sau khi hợp nhất:

```text
1. Organizer đăng ký tài khoản.
2. Organizer gửi thông tin xác minh pháp lý.
3. Admin duyệt organizer.
4. Organizer tạo event, có thể bật/tắt yêu cầu KYC.
5. Admin duyệt event.
6. Volunteer xem event.
7. Nếu event yêu cầu KYC, volunteer phải KYC verified mới đăng ký được.
8. Organizer confirm volunteer.
9. Volunteer check-in QR hoặc organizer manual check-in.
10. Event Service tính giờ tham gia.
11. Rust module sinh certificate.
12. Organizer tạo campaign ủng hộ.
13. Volunteer ủng hộ, organizer confirm.
14. Sponsor gửi đề nghị tài trợ.
15. Organizer accept/received/report sponsorship.
16. Ruby module render báo cáo tài chính.
17. Admin/export xem tổng hợp tác động xã hội và tài chính.
```

Hợp nhất thành công khi:

- Đăng nhập và role đúng trên toàn hệ thống.
- Event flow chạy hết từ tạo event đến attendance.
- Donation/sponsorship flow chạy hết từ campaign/proposal đến report.
- Certificate/report module phụ gọi được từ C# service.
- Frontend không cần biết chi tiết module phụ nằm ở đâu.

## 4. Hướng dẫn tránh xung đột khi lập trình

### Chia branch rõ ràng

Mỗi người làm trên branch riêng:

```text
feature/identity-kyc
feature/event-attendance-certificate
feature/finance-sponsorship-report
```

Không commit trực tiếp vào branch chính khi chưa build/test.

### Chốt API contract trước khi code

Trước khi mỗi người code độc lập, cả nhóm cần thống nhất:

- Endpoint.
- Method.
- Request body.
- Response body.
- Status code khi lỗi.
- Tên field và kiểu dữ liệu.

Ví dụ contract cần chốt:

```text
POST /api/events
POST /api/events/{id}/approve
POST /api/events/{id}/registrations
POST /api/registrations/{id}/confirm
POST /api/attendance/check-in
POST /api/support-campaigns
POST /api/donations
POST /api/sponsorship-proposals
POST /api/sponsorship-proposals/{id}/accept
```

### Hạn chế cùng sửa file chung

Các file dễ conflict:

- `BaseCore.APIService/Program.cs`
- `BaseCore.WebClient/src/App.jsx`
- `BaseCore.WebClient/src/components/layouts/MainLayout.jsx`
- `BaseCore.Entities/*`
- `BaseCore.Repository/MySqlDbContext.cs`
- `BaseCore.Repository/Migrations/*`
- `package.json`
- `.csproj`
- `.sln`

Nếu bắt buộc phải sửa các file này, cần báo trước cho nhóm.

### Tách đăng ký module để giảm sửa Program.cs

Nên tạo extension riêng cho từng module:

```text
AddIdentityModule()
AddEventModule()
AddFinanceModule()
```

Sau đó `Program.cs` chỉ gọi extension, mỗi thành viên sửa file module của mình.

### Quản lý migration

Không nên 3 người cùng tạo migration cùng lúc. Cách tốt hơn:

- Mỗi người ghi lại entity/field cần thêm.
- Một người tổng hợp migration.
- Sau khi migration được merge, cả nhóm pull lại rồi mới code tiếp.

### Commit nhỏ và thường xuyên

Mỗi commit nên có nội dung rõ:

```text
feat(identity): add volunteer KYC status
feat(events): add QR attendance endpoint
feat(finance): add sponsorship proposal report
```

Trước khi push:

```text
dotnet build BaseCore.sln
npm run build
```

Nếu sửa module Rust/Ruby thì chạy thêm test/build của module đó.

### Pull/rebase thường xuyên

Trước khi bắt đầu làm và trước khi push:

```text
git pull --rebase
```

Nếu có conflict, ưu tiên giữ logic mới nhất của người phụ trách module đó. Không tự ý xóa code của người khác nếu chưa hiểu.

### Kiểm thử sau khi hợp nhất

Sau mỗi lần merge lớn, chạy lại workflow chuẩn:

```text
1. Organizer verified tạo event, bật/tắt KYC.
2. Admin duyệt event.
3. Volunteer chưa KYC bị chặn nếu event yêu cầu KYC.
4. Volunteer KYC verified đăng ký.
5. Organizer confirm và check-in QR/manual.
6. Organizer tạo campaign.
7. Volunteer ủng hộ, organizer confirm.
8. Sponsor gửi đề nghị tài trợ.
9. Organizer accept/received/report.
10. Xem report/certificate/export.
```

Nếu workflow này chạy được thì việc hợp nhất giữa 3 phần được xem là đạt.
