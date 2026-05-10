# Workflow demo chuẩn - Volunteer Hub

Tài liệu này dùng để tự test demo hệ thống Volunteer Hub theo một vòng nghiệp vụ tự nhiên: **Organizer tạo sự kiện trước, Admin duyệt sau**, rồi Volunteer/Sponsor mới tham gia.

## 1. Chuẩn bị môi trường

### 1.1. Cập nhật database local

Chạy tại thư mục repo:

```powershell
cd D:\FW\FW\BaseCore
dotnet restore BaseCore.sln
dotnet ef database update --project BaseCore.Repository --startup-project BaseCore.APIService --context MySqlDbContext
```

Nếu máy chưa có EF tool:

```powershell
dotnet tool install --global dotnet-ef
```

### 1.2. Reset dữ liệu demo

Chạy khi muốn đưa database về trạng thái demo sạch:

```powershell
cd D:\FW\FW\BaseCore
.\scripts\reset-demo-data.ps1 -Server "(localdb)\MSSQLLocalDB" -Database "VolunteerHub" -ConfirmReset
```

Nếu đang dùng SQL Server instance khác, thay `-Server` và `-Database` đúng với connection string trong `appsettings.json`.

### 1.3. Chạy backend/frontend

Mở 4 terminal riêng:

```powershell
cd D:\FW\FW\BaseCore\BaseCore.AuthService
dotnet run
```

```powershell
cd D:\FW\FW\BaseCore\BaseCore.APIService
dotnet run
```

```powershell
cd D:\FW\FW\BaseCore\BaseCore.ApiGateway
dotnet run
```

```powershell
cd D:\FW\FW\BaseCore\BaseCore.WebClient
npm install
npm run dev
```

Các URL cần có:

- Frontend: `http://localhost:3000`
- Gateway: `http://localhost:5000`
- APIService: `http://localhost:5001`
- AuthService: `http://localhost:5002`

## 2. Tài khoản demo

- Admin: `admin` / `admin123`
- Organizer: `organizer` / `organizer123`
- Volunteer: `volunteer` / `volunteer123`
- Sponsor: `sponsor` / `sponsor123`

## 3. Tổng quan thứ tự demo

Chạy theo đúng thứ tự này để dữ liệu phát sinh hợp lý:

1. Public smoke test.
2. Organizer tạo `Demo Event QA`.
3. Admin duyệt `Demo Event QA`.
4. Organizer mở event đã duyệt, tạo ca làm việc và milestone.
5. Volunteer đăng ký event.
6. Organizer confirm và check-in volunteer.
7. Sponsor tài trợ event.
8. Organizer hoàn thành event.
9. Volunteer kiểm tra certificate/badge/rating.
10. Admin kiểm tra monitoring/export.
11. Test mobile viewport.
12. Cleanup data demo.

## 4. Smoke test public

1. Mở `http://localhost:3000`.
2. Kiểm tra landing page hiển thị:
   - Brand `VolunteerHub`.
   - CTA khám phá sự kiện/đăng ký.
   - Footer `© 2026 VolunteerHub · CNTT59 - MTA`.
3. Vào `/events`.
4. Kiểm tra:
   - Danh sách sự kiện public hiển thị.
   - Bộ lọc/tìm kiếm hoạt động.
   - Chuyển list/map không vỡ layout.
5. Mở một event detail bất kỳ.
6. Kiểm tra:
   - Thông tin thời gian, địa điểm, kỹ năng, organizer.
   - Nút chia sẻ/copy link.
   - Nếu event completed, có phần impact công khai.

## 5. Organizer tạo sự kiện

### 5.1. Đăng nhập organizer

1. Vào `/login`.
2. Đăng nhập `organizer/organizer123`.
3. Vào `/events/create`.

### 5.2. Tạo event demo

Tạo sự kiện mới với dữ liệu dễ nhận biết:

- Tên: `Demo Event QA`
- Mô tả: nhập mô tả ngắn bất kỳ.
- Danh mục: chọn category có sẵn.
- Số lượng tối đa: `20`
- Thời gian bắt đầu/kết thúc: chọn thời gian hợp lệ, kết thúc sau bắt đầu.
- Địa điểm: nhập địa điểm cụ thể.
- Tọa độ: nhập hoặc chọn tọa độ hợp lệ trên bản đồ.
- Kỹ năng: chọn ít nhất một kỹ năng nếu danh sách có dữ liệu.

Sau khi submit:

1. Vào `/my-events`.
2. Kiểm tra `Demo Event QA` xuất hiện.
3. Trạng thái mong đợi: `Pending`.

## 6. Admin duyệt event do organizer tạo

### 6.1. Đăng nhập admin

1. Đăng xuất organizer.
2. Đăng nhập `admin/admin123`.
3. Vào `/admin/events`.

### 6.2. Duyệt event

1. Chọn filter/tab trạng thái `Pending` nếu có.
2. Tìm `Demo Event QA`.
3. Bấm duyệt/approve.
4. Kiểm tra trạng thái chuyển thành `Approved`.

### 6.3. Test từ chối event nếu cần

Nếu muốn test thêm nhánh reject:

1. Đăng nhập organizer và tạo một event phụ, ví dụ `Demo Reject QA`.
2. Đăng nhập admin.
3. Tìm event phụ.
4. Bấm reject.
5. Kiểm tra trạng thái chuyển thành `Rejected`.

Không dùng event bị reject cho các bước tiếp theo.

## 7. Organizer quản lý event đã duyệt

### 7.1. Mở màn quản lý event

1. Đăng xuất admin.
2. Đăng nhập lại `organizer/organizer123`.
3. Vào `/my-events`.
4. Mở quản lý `Demo Event QA`.
5. Kiểm tra các tab:
   - Danh sách đăng ký.
   - Ca làm việc.
   - Điểm danh.
   - Tiến độ tài trợ.
   - Báo cáo.

### 7.2. Tạo ca làm việc

Trong tab `Ca làm việc`, tạo ca:

- Tên: `Ca sáng QA`
- Thời gian: nằm trong khoảng thời gian event.
- Số lượng tối đa: `5`

Kết quả mong đợi:

- Ca mới hiển thị trong danh sách.
- Dữ liệu thời gian/số lượng không báo validation lỗi.

### 7.3. Tạo milestone

Trong tab `Tiến độ tài trợ`, tạo milestone:

- Tiêu đề: `Chuẩn bị vật tư QA`
- Mô tả: nhập ngắn.
- Trạng thái: chọn trạng thái hợp lệ.
- Progress: `25`

Kết quả mong đợi:

- Milestone hiển thị đúng.
- Trạng thái/progress hiển thị đúng.

## 8. Volunteer đăng ký event

### 8.1. Cập nhật profile

1. Đăng xuất organizer.
2. Đăng nhập `volunteer/volunteer123`.
3. Vào `/profile`.
4. Cập nhật kỹ năng, ngôn ngữ, sở thích nếu cần.
5. Lưu và kiểm tra không báo lỗi validation.

### 8.2. Đăng ký `Demo Event QA`

1. Vào `/events`.
2. Mở `Demo Event QA`.
3. Chọn ca `Ca sáng QA` nếu UI yêu cầu/chọn được.
4. Bấm đăng ký tham gia.
5. Vào `/my-registrations`.
6. Kiểm tra đăng ký có trạng thái `Pending`.

### 8.3. Test rút đăng ký nếu cần

Nếu muốn test nhánh cancel:

1. Khi registration còn `Pending`, bấm hủy/rút đăng ký.
2. Kiểm tra trạng thái thành `Cancelled`.
3. Đăng ký lại `Demo Event QA` để tiếp tục luồng confirm/check-in.

## 9. Organizer confirm và check-in

### 9.1. Confirm volunteer

1. Đăng xuất volunteer.
2. Đăng nhập `organizer/organizer123`.
3. Vào `/my-events`.
4. Mở quản lý `Demo Event QA`.
5. Vào tab `Danh sách đăng ký`.
6. Confirm volunteer vừa đăng ký.

Kết quả mong đợi:

- Registration chuyển từ `Pending` sang `Confirmed`.

### 9.2. Check-in volunteer

1. Vào tab `Điểm danh`.
2. Chọn volunteer đã `Confirmed`.
3. Điểm danh bằng QR hoặc GPS theo UI hiện có.
4. Kiểm tra volunteer có trạng thái đã điểm danh.

Kết quả mong đợi:

- Volunteer được đánh dấu attended/đã điểm danh.
- Giờ tình nguyện hoặc dữ liệu tham gia được ghi nhận theo rule hiện có.

## 10. Sponsor tài trợ event

1. Đăng xuất organizer.
2. Đăng nhập `sponsor/sponsor123`.
3. Vào `/events`.
4. Mở `Demo Event QA`.
5. Gửi tài trợ:
   - Loại đóng góp: tài chính/nhu yếu phẩm/dịch vụ tùy UI.
   - Amount: giá trị hợp lệ.
   - Note: `Tài trợ demo QA`.
6. Vào `/my-sponsorships`.
7. Kiểm tra tài trợ vừa tạo hiển thị.

Kết quả mong đợi:

- Sponsorship được tạo cho event `Approved`.
- Danh sách tài trợ của sponsor hiển thị đúng event và ghi chú.

## 11. Organizer hoàn thành event

1. Đăng xuất sponsor.
2. Đăng nhập `organizer/organizer123`.
3. Mở quản lý `Demo Event QA`.
4. Bấm `Hoàn thành`.
5. Kiểm tra event chuyển thành `Completed`.
6. Vào tab `Báo cáo`.
7. Kiểm tra các số liệu:
   - Tổng đăng ký.
   - Đã xác nhận.
   - Đã điểm danh.
   - Giờ đóng góp nếu có.
   - Tài trợ/impact nếu có.

## 12. Volunteer kiểm tra chứng chỉ, badge, rating

### 12.1. Kiểm tra certificate

1. Đăng xuất organizer.
2. Đăng nhập `volunteer/volunteer123`.
3. Vào `/my-certificates`.
4. Kiểm tra certificate được cấp nếu volunteer đã điểm danh.
5. Bấm tải PDF nếu có.
6. Mở link verify certificate nếu có.

### 12.2. Kiểm tra badge/passport

1. Vào `/my-badges`.
2. Kiểm tra badge được cấp nếu đủ điều kiện.
3. Vào `/profile/passport`.
4. Kiểm tra lịch sử tham gia và tổng giờ.

### 12.3. Volunteer rating organizer

1. Vào `/my-registrations`.
2. Với `Demo Event QA` đã `Completed`, tạo đánh giá organizer.
3. Kiểm tra chỉ event completed mới cho đánh giá.

## 13. Organizer rating volunteer

1. Đăng xuất volunteer.
2. Đăng nhập `organizer/organizer123`.
3. Vào quản lý `Demo Event QA`.
4. Trong danh sách đăng ký/report, đánh giá volunteer đã tham gia/điểm danh nếu UI hiển thị form.

Kết quả mong đợi:

- Organizer chỉ đánh giá volunteer thuộc event của mình và đã tham gia hợp lệ.

## 14. Admin kiểm tra monitoring/export/quản trị

### 14.1. Monitoring

1. Đăng xuất organizer.
2. Đăng nhập `admin/admin123`.
3. Vào `/admin/monitoring`.
4. Kiểm tra health/số liệu/audit log hiển thị.

### 14.2. Export

1. Vào `/admin/export`.
2. Export JSON.
3. Mở file tải về để chắc không bị `[object Object]`.

### 14.3. Category/skill smoke test

Chỉ chạy nếu muốn test thao tác ghi admin:

1. Vào `/admin/categories`.
2. Tạo category `Demo Category QA`.
3. Sửa tên.
4. Xóa nếu chưa được event dùng.
5. Vào `/admin/skills`.
6. Tạo skill `Demo Skill QA`.
7. Sửa tên.
8. Xóa nếu chưa được dùng.

## 15. Mobile viewport checklist

Test tối thiểu ở viewport gần mobile, ví dụ `390x844`:

1. `/`
2. `/events`
3. `/events/:id`
4. `/login`
5. `/dashboard`
6. `/events/create`
7. `/events/:id/manage`
8. `/my-registrations`
9. `/my-sponsorships`
10. `/admin/monitoring`

Checklist:

- Không tràn ngang.
- Header/menu dùng được.
- Form input không bị bó quá hẹp.
- Button chính dễ bấm.
- Modal không vượt khỏi viewport.
- Text tiếng Việt không bị mojibake.

## 16. Cleanup sau demo

Nếu đã tạo data demo, nên reset lại:

```powershell
cd D:\FW\FW\BaseCore
.\scripts\reset-demo-data.ps1 -Server "(localdb)\MSSQLLocalDB" -Database "VolunteerHub" -ConfirmReset
```

Hoặc xóa riêng các record có prefix `Demo`/`QA` nếu muốn giữ data khác.

## 17. Kết quả pass mong đợi

Một vòng demo đạt khi:

1. Public page và event list/detail xem được.
2. Organizer tạo event pending được.
3. Admin duyệt event đó thành approved được.
4. Organizer tạo ca, tạo milestone, confirm, check-in, complete được.
5. Volunteer đăng ký, xem registration, certificate/badge/passport/rating được.
6. Sponsor tài trợ và xem danh sách tài trợ được.
7. Admin monitoring/export hoạt động.
8. Mobile viewport không tràn ngang ở các màn chính.
9. Build backend/frontend pass sau khi dọn port:

```powershell
dotnet build BaseCore.sln --no-incremental
cd BaseCore.WebClient
npm run build
```
