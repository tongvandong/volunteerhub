# BaseCore Project Reading Guide

File này là living document để lần sau đọc project nhanh, không cần quét lại toàn bộ repo từ đầu.

## 1. Project Là Gì

Đây là hệ thống VolunteerHub trên `.NET 8`, backend chia theo hướng microservice:

- `BaseCore.ApiGateway`: gateway public, dùng Ocelot, port `5000`.
- `BaseCore.AuthService`: đăng ký, đăng nhập, JWT, refresh token, profile, KYC, organizer verification, port `5002`.
- `BaseCore.EventService`: sự kiện, đăng ký, điểm danh, certificate, channel, dashboard, port `5003`.
- `BaseCore.FinanceService`: donation, sponsorship, campaign, financial report, port `5004`.
- `BaseCore.APIService`: legacy fallback, vẫn chứa toàn bộ controller gốc, port `5001`.
- `BaseCore.Repository`: EF Core, DbContext, repository, migration (shared).
- `BaseCore.Services`: business logic (shared).
- `BaseCore.Entities`: domain entities (shared).
- `BaseCore.WebClient`: frontend chính đang dùng.

Repo vẫn còn dấu vết domain cũ `Product/Category/Order`, nhưng hướng chính hiện tại là VolunteerHub.

Cách tách service: `BaseCore.EventService` và `BaseCore.FinanceService` dùng `<Compile Include="...">` link controller từ `BaseCore.APIService/Controllers/Events/` và `Controllers/Finance/` — không duplicate code, chỉ tạo host riêng.

## 2. Cách Đọc Project Nhanh

Thứ tự đọc nên dùng:

1. `D:\FW\FW\BaseCore\Context\project-reading-guide.md`
2. `D:\FW\FW\BaseCore\Context\volunteerHub.md`
3. `D:\FW\FW\BaseCore\BaseCore.WebClient\src\App.jsx`
4. `D:\FW\FW\BaseCore\BaseCore.WebClient\src\services\api.js`
5. `D:\FW\FW\BaseCore\BaseCore.ApiGateway\ocelot.json`
6. `D:\FW\FW\BaseCore\BaseCore.APIService\Program.cs`
7. `D:\FW\FW\BaseCore\BaseCore.AuthService\Program.cs`
8. `D:\FW\FW\BaseCore\BaseCore.Repository\MySqlDbContext.cs`

Khi debug một feature cụ thể, đi theo chuỗi:

1. Page/component frontend
2. Hàm gọi trong `api.js`
3. Controller backend
4. Service backend
5. Entity/DbContext

## 3. Runtime Thực Tế

Các service chính:

- Gateway: `http://localhost:5000`
- Legacy Core API (fallback): `http://localhost:5001`
- Auth / Identity service: `http://localhost:5002`
- Event service: `http://localhost:5003`
- Finance service: `http://localhost:5004`

Gateway route (Ocelot, priority-based):

- `/api/auth/*`, `/api/profile/*`, `/api/users/*`, `/api/skills/*`, `/api/Roles/*`, `/api/organizer/verification/*`, `/api/uploads/*`, `/api/notifications/*`, `/api/badges`, `/api/my-badges`, `/api/admin/users/*`, `/api/admin/volunteer-kyc/*`, `/api/admin/volunteer-skill-verifications/*`, `/api/admin/organizer-verifications/*`, `/api/admin/monitoring/*`, `/api/admin/audit-logs`, `/api/admin/export/users` -> **AuthService** `5002`
- `/api/events/{eventId}/support-campaigns/*`, `/api/events/{eventId}/sponsors/*`, `/api/events/{eventId}/sponsor-milestones/*`, `/api/events/{eventId}/sponsorship-proposals/*`, `/api/support-campaigns/*`, `/api/donations/*`, `/api/sponsors/*`, `/api/sponsorship-proposals/*`, `/api/admin/finance/*`, `/api/admin/export/finance` -> **FinanceService** `5004`
- `/api/events/*`, `/api/event-categories/*`, `/api/my-registrations`, `/api/certificates/*`, `/api/channels/*`, `/api/dashboard/*` -> **EventService** `5003`
- `/api/admin/export/events` -> **APIService** `5001`
- `/api/*` còn lại -> **Legacy APIService** `5001` (fallback, priority thấp nhất)

Frontend cũ tạo axios client với:

- `baseURL: '/api'`

Vì vậy frontend kỳ vọng đi qua gateway/reverse proxy, không gọi trực tiếp `5001` hoặc `5002`.

## 4. Database

`DbContext` tên là `MySqlDbContext`, nhưng runtime hiện dùng SQL Server qua `UseSqlServer(...)`.

Database hiện tại:

- DB: `VolunteerHub`
- SQL Server instance: `LAPTOP-70RJA2GI\SQLSERVER2022DEV`

Cả `AuthService`, `APIService`, `EventService` và `FinanceService` đều chạy migration lúc startup qua:

- `DatabaseMigrationRunner.RunWithProcessLock(db)` (dùng named Mutex, serialize nếu start đồng thời)

Tất cả service dùng chung 1 database. Đây là thiết kế có chủ đích cho giai đoạn đồ án.

## 5. Domain Chính

VolunteerHub hiện có các nhóm domain:

- Auth/user: `User`, `AuthRefreshToken`
- Profile/kỹ năng: `VolunteerProfile`, `Skill`, `VolunteerSkill`
- Sự kiện: `Event`, `EventCategory`, `WorkShift`
- Đăng ký: `Registration`
- Kênh trao đổi: `Channel`, `Post`, `Comment`, `Like`
- Ghi nhận đóng góp: `Certificate`, `Badge`, `UserBadge`, `Rating`
- Hỗ trợ khác: `EventSponsor`, `Notification`

## 6. Frontend Chính

Frontend đang dùng:

- `D:\FW\FW\BaseCore\BaseCore.WebClient`

Các file quan trọng:

- Router: `D:\FW\FW\BaseCore\BaseCore.WebClient\src\app\routes\AppRoutes.jsx`
- Auth state: `D:\FW\FW\BaseCore\BaseCore.WebClient\src\contexts\AuthContext.jsx`
- API contract: `D:\FW\FW\BaseCore\BaseCore.WebClient\src\api\`

Frontend cũ/thử nghiệm đã được dọn khỏi repo; khi debug UI chạy thật, chỉ đi theo `BaseCore.WebClient`.

Landing page public đã được nâng cấp:

- File chính: `D:\FW\FW\BaseCore\BaseCore.WebClient\src\pages\public\LandingPage.jsx`.
- Hero dùng ảnh nền tình nguyện, headline `VolunteerHub`, CTA `Khám phá sự kiện` và `Đăng ký ngay`.
- Có section phân vai cho `Tình nguyện viên`, `Ban tổ chức`, `Nhà tài trợ`, `Quản trị viên`.
- Có quy trình 3 bước: `Khám phá`, `Đăng ký`, `Ghi nhận`.
- Có section `Sự kiện nổi bật` gọi `eventApi.getAll({ status: 'Approved', page: 1, pageSize: 6 })`.
- Khi verify landing, phát hiện API event list trả kèm `organizer.password` và `organizer.salt`; đã chặn serialize hai field này bằng `[JsonIgnore]` trong `BaseCore.Entities\User.cs`.
- Playwright DOM check landing: hero/roles/steps/event links render được, text không mojibake.
- Sau feedback UI, hero đã được tăng tương phản: thêm left-side dark scrim, chữ mô tả sáng hơn, text-shadow nhẹ, badge/thống kê dùng nền tối bán trong suốt để không bị chìm trên ảnh nền.

## 7. Route Frontend Cũ

Public:

- `/`
- `/events`
- `/events/:id`
- `/verify/:code`

Auth:

- `/login`
- `/register`

Volunteer:

- `/profile`
- `/profile/passport`
- `/my-registrations`
- `/my-badges`
- `/my-certificates`

Organizer:

- `/my-events`
- `/events/create`
- `/events/:id/edit`
- `/events/:id/manage`

Sponsor:

- `/my-sponsorships`

Admin:

- `/admin/events`
- `/admin/users`
- `/admin/categories`
- `/admin/skills`
- `/admin/export`

Shared authenticated:

- `/dashboard`
- `/notifications`
- `/channels/:id`

## 8. Volunteer Flow Status

Volunteer hiện đã có đủ khung chức năng chính:

- Đăng ký/đăng nhập: đã có.
- Xem sự kiện: đã có.
- Đăng ký sự kiện: đã có.
- Chọn ca khi đăng ký: đã có ở `EventDetail.jsx`.
- Thoái đăng sự kiện: đã có ở `MyRegistrations.jsx` và `EventDetail.jsx`.
- Xem lịch sử tham gia: đã có cơ bản.
- Nhận thông báo: đã có dạng pull, chưa realtime.
- Truy cập kênh trao đổi: đã có.
- Dashboard: đã có.

Các sửa quan trọng đã làm:

- `EventDetail.jsx` link channel bằng `event.channel.id`, không dùng `event.id`.
- `Channel.jsx` gọi API comment/like theo đúng cặp `channelId + postId`.
- Backend có endpoint `GET /api/events/{eventId}/my-registration`.
- Trang chi tiết sự kiện hiển thị trạng thái đăng ký hiện tại của volunteer.
- Volunteer chỉ rút đăng ký khi trạng thái là `Pending`, khớp rule backend hiện tại.

Điểm nên cải thiện sau:

- Notification realtime hoặc polling tốt hơn.
- Dashboard volunteer sâu hơn: gợi ý sự kiện, đăng ký gần đây, nhắc lịch, thông báo chưa đọc.

## 9. Organizer Flow Status

Các sửa đã làm:

- `ManageEvent.jsx` gọi đúng API:
  - confirm: `eventId + regId`
  - cancel: `eventId + regId`
  - check-in: `eventId + regId + { qrCode }`
- `ManageEvent.jsx` đọc registration user bằng `r.user`, không dùng `r.volunteer`.
- Check-in UX hiện đúng backend:
  - chọn volunteer đã `Confirmed`
  - nhập mã QR của sự kiện
  - hiển thị `event.qrCode` nếu có
- Backend có endpoint `GET /api/events/my`.
- `MyEvents.jsx` dùng `/api/events/my`, không còn kéo toàn bộ events rồi filter ở client.
- `EventsController.Update` đã nhận và lưu `RequiredSkillIds`, nên edit event không làm mất kỹ năng yêu cầu.

Checklist organizer sau lượt rà mới nhất:

- Đăng ký/đăng nhập: đã có qua `AuthService`.
- Quản lý sự kiện: đã có `MyEvents.jsx`, `EventForm.jsx`, `ManageEvent.jsx`.
- Xác nhận đăng ký: đã có trong tab `Danh sách đăng ký` của `ManageEvent.jsx`.
- Đánh dấu hoàn thành: đã có nút `Hoàn thành` trong `ManageEvent.jsx`, gọi `PUT /api/events/{id}/complete`.
- Xem báo cáo: đã có tab `Báo cáo` trong `ManageEvent.jsx`.
- Truy cập kênh trao đổi: đã có link `Kênh trao đổi` trong `ManageEvent.jsx` khi event có `channel.id`.
- Xem Dashboard: đã có dashboard riêng cho organizer trong `Dashboard.jsx`.
- `MyEvents.jsx` hiện cho vào màn quản lý cả sự kiện `Approved` và `Completed`, để organizer vẫn xem được báo cáo sau khi sự kiện đã hoàn thành.
- Các màn organizer chính đã được dọn text mojibake:
  - `Dashboard.jsx`
  - `MyEvents.jsx`
  - `EventForm.jsx`
  - `ManageEvent.jsx`

## 10. Admin Flow Status

Các sửa đã làm:

- `AdminEvents.jsx` dùng các action:
  - `PUT /api/events/{id}/approve`
  - `PUT /api/events/{id}/reject`
  - `PUT /api/events/{id}/complete`
- Backend hiện cho cả `Organizer` và `Admin` gọi `complete`.
  - Organizer vẫn bị kiểm tra đúng `OrganizerId`.
  - Admin được phép hoàn thành sự kiện để khớp màn hình admin.
- Trạng thái từ chối sự kiện đã thống nhất là `Rejected`.
  - Trước đó UI dùng `Rejected`, nhưng backend lưu `Cancelled`, khiến filter admin bị lệch.
- `AdminUsers.jsx` đọc đúng response từ backend:
  - `name`
  - `userName`
  - `email`
  - `userType`
  - `isActive`
- `adminApi.getUsers` gửi query `keyword`, đúng với `AdminController.GetUsers`.
  - Trước đó frontend gửi `search`, backend không đọc.
- `AdminExport.jsx` đã stringify JSON trước khi tạo file tải xuống.
  - Trước đó export JSON có nguy cơ ra `[object Object]`.
- Các màn admin chính đã được dọn text mojibake:
  - `AdminEvents.jsx`
  - `AdminUsers.jsx`
  - `AdminCategories.jsx`
  - `AdminSkills.jsx`
  - `AdminExport.jsx`
  - `StatusBadge.jsx`

## 11. Sponsor Flow Status

Sponsor hiện đã có các phần chính:

- Đăng ký/đăng nhập: đã có qua `AuthService`.
- Xem sự kiện để tài trợ: dùng danh sách event `Approved`.
- Gửi tài trợ cho sự kiện: `POST /api/events/{eventId}/sponsors`.
- Xem danh sách tài trợ của tôi: `GET /api/sponsors/my`.
- Xem Dashboard: đã có nhánh sponsor trong `Dashboard.jsx`.

Các sửa quan trọng đã làm:

- Thêm backend endpoint `GET /api/sponsors/my` trong `SponsorController`.
- Thêm repository method `GetBySponsorAsync(int sponsorId)` trong `EventSponsorRepository`.
- `MySponsorships.jsx` hiện gửi đúng payload backend nhận:
  - `contributionType`
  - `amount`
  - `note`
- Trước đó frontend gửi `description`, backend nhận `note`, nên ghi chú tài trợ có thể bị mất.
- `MySponsorships.jsx` đã được dọn text mojibake.

## 12. Những Điểm Dễ Nhầm

- Có hai frontend, nhưng frontend chính hiện là `BaseCore.WebClient`.
- `MySqlDbContext` là tên cũ; provider thực tế là SQL Server.
- Product/category/order là domain cũ/demo, chưa phải trọng tâm hiện tại.
- `channelId` khác `eventId`; không được giả định hai id này bằng nhau.
- Event status hiện dùng:
  - `Pending`
  - `Approved`
  - `Completed`
  - `Rejected`
  - `Cancelled`
- Registration status hiện dùng:
  - `Pending`
  - `Confirmed`
  - `Cancelled`

## 13. Flow Audit 2026-04-29

Build kiểm chứng:

- `dotnet build BaseCore.sln --no-incremental`: pass, `0 Warning(s)`, `0 Error(s)`.
- `npm run build` trong `BaseCore.WebClient`: pass.

Kết luận nghiệp vụ hiện tại:

- Luồng public/auth/volunteer/organizer/sponsor/admin đã có đủ màn hình chính và API chính.
- Frontend chính vẫn là `BaseCore.WebClient`; router, `api.js`, controller và service đang khớp tốt hơn nhiều so với giai đoạn đầu.
- Các flow cốt lõi đã có:
  - Volunteer xem event, đăng ký, chọn ca, rút khi `Pending`, xem lịch sử, thông báo, channel, dashboard.
  - Organizer tạo/sửa event, tạo ca, xem event của mình, xác nhận/hủy đăng ký, check-in bằng QR, hoàn thành event, xem báo cáo, vào channel, dashboard.
  - Admin duyệt/từ chối/hoàn thành event, quản lý user/category/skill, export.
  - Sponsor xem event đã duyệt, gửi tài trợ, xem danh sách tài trợ, dashboard.

Điểm nên harden tiếp trước khi coi là “chắc nghiệp vụ”:

- `GET /api/events/{id}/registrations` đã được giới hạn cho admin hoặc organizer sở hữu event.
- Registration action `confirm/cancel/check-in` đã kiểm `regId` thuộc đúng `eventId` trên route.
- Channel post/comment/like đã kiểm user có quyền vào channel và `postId/commentId` thuộc đúng `channelId`.
- Đăng ký theo ca đã validate shift thuộc event và kiểm ca còn chỗ bằng số registration active trong ca.
- Volunteer có thể đăng ký lại nếu registration cũ đang `Cancelled`; record được reset về `Pending`.
- Sponsor add sponsorship đã kiểm event tồn tại và phải đang `Approved`.
- Filter event theo skill đã parse JSON thay vì dùng `string.Contains`.
- Hoàn thành event hiện chỉ cho event đang `Approved`.

Điểm còn lại nếu muốn nâng cấp sâu hơn:

- `WorkShift` chưa có cột `CurrentVolunteers`; hiện capacity ca được tính từ registration active thay vì lưu counter riêng.
- Nếu cần hiệu năng cao cho filter skill, nên tách `RequiredSkillIds` từ chuỗi JSON sang bảng join.

## 14. Requirement Coverage 2026-04-29

Đối chiếu với file yêu cầu Volunteer Hub:

- Portfolio: đã có hồ sơ kỹ năng, nhóm máu, ngôn ngữ, sở thích, bio/avatar; Volunteer Passport có lịch sử tham gia, tổng giờ, chứng chỉ.
- Event management: organizer đã tạo/sửa event với mô tả, kỹ năng, thời gian, địa điểm, số lượng; admin duyệt/từ chối event.
- Matching theo kỹ năng/vị trí: đã có filter skill parse JSON, map event, geolocation và radius filter ở frontend.
- Approval volunteer: organizer đã xem danh sách đăng ký, xác nhận/hủy, xem profile cơ bản qua dữ liệu user/registration.
- Operations: đã có QR check-in và GPS check-in trong `ManageEvent.jsx`; backend nhận QR hoặc tọa độ trong `RegistrationService.CheckInAsync`.
- Shift management: đã tạo ca, volunteer chọn ca khi đăng ký, backend kiểm shift thuộc event và capacity ca.
- Certificate: khi event hoàn thành, backend tự cấp certificate cho volunteer đã điểm danh; có verify code và endpoint tải PDF tối thiểu `/api/certificates/{code}/pdf`.
- Badge: badge được award tự động theo điều kiện `min_events`/`min_hours`.
- Rating hai chiều: backend chỉ cho rating sau khi event `Completed`; volunteer đã tham gia đánh giá organizer, organizer sở hữu event đánh giá volunteer đã tham gia. UI có form rating ở `MyRegistrations.jsx` và `ManageEvent.jsx`.
- Transparency: event completed có public impact endpoint `/api/events/{id}/impact` và `EventDetail.jsx` hiển thị số người tham gia, giờ đóng góp, chứng chỉ, sponsor.
- Social sharing: `EventDetail.jsx` có nút share/copy link sự kiện.

Backlog còn lại so với vision đầy đủ:

- PDF certificate hiện là PDF tối thiểu với certificate code + verify URL; chưa render QR matrix thật trong PDF.
- Chưa có workflow phỏng vấn trực tuyến riêng trước khi approve volunteer.
- Chưa có module kiểm duyệt pháp lý organizer hoặc upload giấy tờ pháp lý.
- Chưa có complaint/ticket workflow cho admin xử lý khiếu nại.
- Sponsor tracking mới ở mức tài trợ và impact summary; chưa có timeline/progress riêng cho sponsor.
- Performance lớn vẫn ở mức pagination/filter cơ bản; chưa có caching/rate limiting chuyên biệt cho chiến dịch khẩn cấp.

Test mới đã chạy ngày 2026-04-29:

- Build backend `dotnet build BaseCore.sln --no-incremental`: pass.
- Build frontend `npm run build`: pass.
- API E2E qua gateway pass 22 checks:
  - Admin login, organizer/volunteer/sponsor register/login.
  - Organizer tạo event, admin approve, sponsor tài trợ event approved.
  - Organizer tạo shift, volunteer đăng ký shift.
  - Volunteer bị chặn khi đọc `/api/events/{id}/registrations`.
  - Organizer confirm, GPS check-in, complete event.
  - Public impact phản ánh attended volunteer, volunteer hours, sponsor.
  - Volunteer rating organizer và organizer rating volunteer pass.
  - Sponsor rating volunteer bị chặn `403`.
  - Certificate được cấp và PDF endpoint trả `application/pdf` với header `%PDF-`.
- UI Playwright pass:
  - Event detail render `Tac dong cong khai` và `Chia se`.
  - Organizer manage event render rating UI và nút `Diem danh bang GPS`.
  - Volunteer registrations render rating UI.
  - My certificates render link `Tai PDF`.

## 15. Verify Sau Khi Sửa

Các lệnh build đã dùng và hiện pass:

```powershell
cd D:\FW\FW\BaseCore\BaseCore.WebClient
npm run build
```

```powershell
cd D:\FW\FW\BaseCore
dotnet build BaseCore.sln
```

Trạng thái hardening mới nhất:

- `AutoMapper 13.0.1` đã được gỡ khỏi `BaseCore.Common` và `BaseCore.Libs`.
- Lý do gỡ thay vì nâng version: repo không có usage thật của `AutoMapper`, `IMapper`, `CreateMap`, `.Map<T>`; package đang là dependency dư.
- Warning bảo mật `NU1903` của AutoMapper đã hết.
- Sau khi gỡ AutoMapper, audit thêm bằng:

```powershell
dotnet list BaseCore.sln package --vulnerable --include-transitive
```

- Các package gốc đã được nâng trong cùng major/framework để xử lý vulnerability transitive:
  - `Microsoft.AspNetCore.Authentication.JwtBearer` -> `8.0.26`
  - `Microsoft.EntityFrameworkCore*` -> `8.0.26`
  - `StackExchange.Redis` -> `2.7.33`
  - `MongoDB.Driver` -> `2.23.2`
  - `Quartz` -> `3.8.1`
  - `Newtonsoft.Json` -> `13.0.4`
- Kết quả audit hiện tại: không còn vulnerable packages theo NuGet sources đang dùng.
- Nullable warnings có nguy cơ runtime đã được rà và xử lý ở controller/service/domain cũ:
  - Chuẩn hóa input bắt buộc như tên sự kiện, tên category, tên product.
  - Chuẩn hóa field text có thể null về chuỗi rỗng khi entity yêu cầu non-null.
  - Các service `GetById` trả `Category?`, `Product?`, `Order?` đúng với khả năng không tìm thấy dữ liệu.
  - DTO trong `AuthService` phân biệt field bắt buộc, field optional và response default.
  - Helper dùng chung đã xử lý null thật: cache deserialize, enum reflection, dynamic order-by, websocket socket lookup.
- `BaseCore.DTO` và `BaseCore.Entities` đang để `<Nullable>disable</Nullable>` vì đây là POCO/EF/data-contract legacy chưa được annotate nhất quán. Không sửa đại trà các navigation property bằng đoán mò; khi chạm entity cụ thể thì annotate/default theo luồng nghiệp vụ thật.

Backend build hiện tại sạch:

```text
Build succeeded.
0 Warning(s)
0 Error(s)
```

E2E local đã chạy qua gateway + frontend dev:

- Services dùng khi test:
  - Frontend: `http://localhost:3000`
  - Gateway: `http://localhost:5000`
  - APIService: `http://localhost:5001`
  - AuthService: `http://localhost:5002`
- API contract test đã pass:
  - Register/login các role `Admin`, `Organizer`, `Volunteer`, `Sponsor`.
  - Organizer tạo event và shift.
  - Admin approve event, backend tự tạo channel.
  - Volunteer đăng ký event đã approve.
  - Organizer xem registration, confirm, check-in bằng QR, complete event.
  - Volunteer history có registration.
  - Sponsor tạo sponsorship và xem `/api/sponsors/my`.
- UI Playwright test đã pass:
  - Landing/events/login render được, không mojibake ở text đọc được.
  - Organizer login vào `/my-events` và `/dashboard`.
  - Volunteer login vào `/dashboard`.
  - Sponsor login vào `/my-sponsorships`.
  - Admin login vào `/admin/events`.
  - Volunteer mở event detail và đăng ký từ giao diện.
  - Organizer mở `/events/:id/manage` và thấy volunteer trong danh sách đăng ký.
- Screenshot E2E được lưu ở `D:\FW\FW\BaseCore\Context\e2e-screenshots`.

Certificate PDF note:

- Endpoint `GET /api/certificates/{code}/pdf` không dùng PDF text ASCII/Helvetica nữa vì không render được tiếng Việt.
- PDF hiện render certificate thành ảnh JPEG bằng `System.Drawing` + font Arial rồi nhúng ảnh vào PDF. Cách này giữ đúng dấu tiếng Việt trong tên sự kiện/chứng chỉ trên môi trường Windows hiện tại.
- Đã test lại với `CERT-2025-0001`: sự kiện `Dạy kỹ năng số cho người cao tuổi` hiển thị đúng dấu, không còn chuỗi `D?y k? n?ng...`.

Events mobile layout note:

- Trang public `/events` dùng nhiều inline style nên responsive phải bọc thêm class CSS trong `EventList.jsx` và override ở `src/index.css`.
- Mobile `< 768px`: category tabs không sticky, filter xếp 1 cột, nút grid/map/gần tôi/bán kính xếp lại, danh sách event 1 cột, sidebar `Sắp diễn ra` xuống dưới card sự kiện.
- `EventCard` cần `display:block;width:100%;max-width:100%` ở link/card root để không làm vỡ ngang khi nằm trong mobile grid.
- Header public ẩn nút `Đăng ký` trên mobile; người dùng vẫn mở được đăng ký từ menu hoặc CTA trong hero.

## 16. Service Split 2026-05-12

Hệ thống đã được tách thành 4 service backend riêng biệt (+ 1 legacy fallback):

| Service | Project | Port | Phạm vi |
|---|---|---:|---|
| Gateway | `BaseCore.ApiGateway` | `5000` | Ocelot routing, CORS |
| Identity | `BaseCore.AuthService` | `5002` | Auth, profile, KYC, organizer verification, user management, notifications, badges, skills, uploads, monitoring |
| Event | `BaseCore.EventService` | `5003` | Event CRUD, registration, attendance, certificate, channel, dashboard, event export |
| Finance | `BaseCore.FinanceService` | `5004` | Support campaign, donation, sponsorship proposal, sponsor milestones, finance export |
| Legacy | `BaseCore.APIService` | `5001` | Fallback cho mọi route chưa được tách (Product, Order, etc.) |

Cách tách:

- `BaseCore.EventService` và `BaseCore.FinanceService` là project Web riêng, dùng `<Compile Include="...">` link controller từ `BaseCore.APIService/Controllers/Events/` và `Controllers/Finance/`.
- Không duplicate code — sửa controller ở `BaseCore.APIService` thì cả 3 service đều nhận.
- Shared layers: `BaseCore.Entities`, `BaseCore.Repository`, `BaseCore.Services`, `BaseCore.Common`.
- Shared database: cùng `MySqlDbContext`, cùng connection string, cùng migration.
- JWT key giống nhau giữa các service → token từ AuthService validate được ở Event/Finance.

Chạy local sau khi tách (5 terminal):

```powershell
dotnet run --project BaseCore.AuthService --urls http://localhost:5002
dotnet run --project BaseCore.EventService --urls http://localhost:5003
dotnet run --project BaseCore.FinanceService --urls http://localhost:5004
dotnet run --project BaseCore.ApiGateway --urls http://localhost:5000
cd BaseCore.WebClient && npm run dev -- --host 127.0.0.1
```

Lưu ý:

- `BaseCore.APIService` (port 5001) vẫn chạy được độc lập nếu muốn test monolith cũ.
- Nếu chỉ chạy 3 service mới + gateway, legacy fallback sẽ trả 502 cho route chưa tách.
- `AdminController.cs` hiện được link vào cả EventService và FinanceService. Ocelot priority đã route đúng, nhưng nếu gọi trực tiếp service sẽ thấy endpoint thừa. Cần tách `AdminController` thành file riêng nếu muốn sạch hơn.

## 17. Tình Huống Thực Tế A-G (2026-05-12)

Đã triển khai xử lý cho các tình huống thực tế trong vòng đời sự kiện. Chi tiết đầy đủ ở `Context/VolunteerHub-real-world-scenarios.md`.

Tóm tắt endpoint mới:

- `POST /api/events/{id}/resubmit` — organizer gửi lại event bị reject.
- `PUT /api/events/{id}/cancel` — hủy event + cascade (campaign, proposal, notify).
- `PUT /api/events/{id}/transfer` — admin chuyển quyền sở hữu event.
- `POST /api/events/{id}/uncomplete` — admin rollback completed → approved.
- `POST /api/events/auto-complete-overdue` — admin trigger complete event quá hạn.
- `POST /api/events/{eventId}/register/cancel-request` — volunteer xin hủy sau confirm.
- `POST /api/events/{eventId}/walk-in` — organizer đăng ký + check-in tại chỗ.
- `POST /api/events/{eventId}/registrations/{regId}/manual-attend` — bổ sung điểm danh.
- `PUT /api/events/{eventId}/registrations/{regId}/hours` — chỉnh giờ tình nguyện.
- `PUT /api/ratings/{id}/hide|unhide`, `DELETE /api/ratings/{id}` — admin moderation.
- `PUT /api/sponsorship-proposals/{id}/received` nhận `actualReceivedAmount`.
- `PUT /api/sponsorship-proposals/{id}/admin-revert-to-pending` — admin rollback proposal.
- `GET /api/admin/finance/stale-donations`, `unreported-campaigns`, `open-proposals-past-event` — admin monitoring.

Entity changes (3 migrations):

- `Event`: thêm `CancelReason`, `CancelledAt`.
- `Registration`: thêm `CancelRequested`, `CancelRequestedAt`, `CancelReason`.
- `Rating`: thêm `IsHidden`, `HiddenReason`, `HiddenAt`, `HiddenBy`.
- `SponsorshipProposal`: thêm `ActualReceivedAmount`.

Nguyên tắc xuyên suốt:

- Mọi giao dịch tiền đều ngoài hệ thống. Khi event hủy, tiền đã Confirmed/Received giữ nguyên.
- Admin không auto-action khi deactivate user — chỉ trả impact summary.
- Notification tự động khi cancel event, thay đổi time/location, volunteer request-cancel.
- Grace window 7 ngày cho bổ sung điểm danh sau event.

## 18. Khi Nào Cập Nhật File Này

Cập nhật file này khi có thay đổi thuộc một trong các nhóm:

- Đổi frontend chính.
- Đổi port/service/gateway route.
- Đổi database/provider.
- Thêm module/domain lớn.
- Đổi auth flow hoặc token storage.
- Đổi API contract giữa frontend và backend.
- Sửa một flow lớn như volunteer/organizer/admin.
- Tách hoặc gộp service.
