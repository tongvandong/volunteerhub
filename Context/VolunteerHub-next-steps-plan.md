# Kế hoạch triển khai tiếp theo - VolunteerHub

Tài liệu này hướng dẫn từng bước để hoàn thiện hệ thống sau khi đã tách service và thêm xử lý tình huống A-G. Người chưa quen project vẫn có thể làm theo.

## Điều kiện tiên quyết

- Đã pull branch `feature/event-lifecycle-ag-fixes` về local.
- Có .NET SDK 8+, Node.js 20+, SQL Server chạy được.
- Database `VolunteerHub` đã tồn tại (migration tự chạy khi start service).

## Bước 1: Merge branch vào main

**Mục đích**: Đưa code mới vào nhánh chính để cả team dùng.

**Cách làm**:

```powershell
cd D:\FW\FW\BaseCore
git checkout main
git pull origin main
git merge feature/event-lifecycle-ag-fixes
git push origin main
```

Hoặc tạo Pull Request trên GitHub:
- Vào `https://github.com/taoladong/volunteerhub/pull/new/feature/event-lifecycle-ag-fixes`
- Base: `main`, Compare: `feature/event-lifecycle-ag-fixes`
- Bấm "Create pull request" → "Merge pull request"

**Kiểm tra đạt**: `git log --oneline -5` trên main thấy commit "feat: split backend..." và "feat: event lifecycle A-G...".

---

## Bước 2: Sửa connection string cho service mới

**Mục đích**: EventService và FinanceService cần trỏ đúng SQL Server instance của máy bạn.

**File cần sửa** (2 file):
- `BaseCore.EventService/appsettings.json`
- `BaseCore.FinanceService/appsettings.json`

**Cách làm**: Mở file, tìm dòng `"ConnectedDb"`, đổi thành connection string giống `BaseCore.APIService/appsettings.json`:

```json
"ConnectionStrings": {
  "ConnectedDb": "Data Source=LAPTOP-70RJA2GI\\SQLSERVER2022DEV;Initial Catalog=VolunteerHub;Integrated Security=True;Trust Server Certificate=True"
}
```

Thay `LAPTOP-70RJA2GI\\SQLSERVER2022DEV` bằng SQL Server instance trên máy bạn.

**Kiểm tra đạt**: Cả 2 file có cùng connection string với `BaseCore.APIService/appsettings.json`.

---

## Bước 3: Build toàn bộ solution

**Mục đích**: Đảm bảo code compile sạch trước khi chạy.

```powershell
cd D:\FW\FW\BaseCore
dotnet build BaseCore.sln --no-incremental
```

**Kiểm tra đạt**: Output hiện `Build succeeded. 0 Warning(s) 0 Error(s)`.

Nếu lỗi "file is locked": tắt hết process dotnet đang chạy rồi build lại.

---

## Bước 4: Chạy hệ thống kiến trúc mới

**Mục đích**: Start đủ 4 service backend + 1 frontend.

Mở **5 terminal riêng biệt**, mỗi terminal chạy 1 lệnh:

**Terminal 1 - Auth/Identity Service (port 5002)**:
```powershell
cd D:\FW\FW\BaseCore
dotnet run --project BaseCore.AuthService --urls http://localhost:5002
```

**Terminal 2 - Event Service (port 5003)**:
```powershell
cd D:\FW\FW\BaseCore
dotnet run --project BaseCore.EventService --urls http://localhost:5003
```

**Terminal 3 - Finance Service (port 5004)**:
```powershell
cd D:\FW\FW\BaseCore
dotnet run --project BaseCore.FinanceService --urls http://localhost:5004
```

**Terminal 4 - API Gateway (port 5000)**:
```powershell
cd D:\FW\FW\BaseCore
dotnet run --project BaseCore.ApiGateway --urls http://localhost:5000
```

**Terminal 5 - Frontend (port 3000)**:
```powershell
cd D:\FW\FW\BaseCore\BaseCore.WebClient
npm install
npm run dev -- --host 127.0.0.1
```

**Kiểm tra đạt**:
- Mở `http://localhost:3000` → thấy landing page VolunteerHub.
- Mở `http://localhost:5003/health` → thấy "Healthy".
- Mở `http://localhost:5004/health` → thấy "Healthy".
- Mở `http://localhost:5002/health` → thấy "Healthy".

---

## Bước 5: Chạy demo workflow 1 vòng đầy đủ

**Mục đích**: Xác nhận toàn bộ nghiệp vụ chính vẫn hoạt động qua kiến trúc mới.

### 5.1. Public smoke test
1. Mở `http://localhost:3000`.
2. Kiểm tra landing page hiển thị brand VolunteerHub, CTA, footer.
3. Vào `/events` → danh sách sự kiện hiển thị.
4. Mở 1 event detail → thông tin đầy đủ (thời gian, địa điểm, organizer).

### 5.2. Organizer tạo event
1. Đăng nhập `organizer / organizer123`.
2. Vào `/events/create`.
3. Tạo event tên "Test Service Split" với đầy đủ thông tin.
4. Vào `/my-events` → thấy event mới, trạng thái `Pending`.

### 5.3. Admin duyệt event
1. Đăng xuất organizer.
2. Đăng nhập `admin / admin123`.
3. Vào `/admin/events`.
4. Tìm "Test Service Split" → bấm Duyệt.
5. Trạng thái chuyển `Approved`.

### 5.4. Volunteer đăng ký
1. Đăng xuất admin.
2. Đăng nhập `volunteer / volunteer123`.
3. Vào `/events` → mở "Test Service Split".
4. Bấm đăng ký.
5. Vào `/my-registrations` → thấy đăng ký trạng thái `Pending`.

### 5.5. Organizer confirm + check-in
1. Đăng xuất volunteer.
2. Đăng nhập `organizer / organizer123`.
3. Vào `/my-events` → mở quản lý "Test Service Split".
4. Tab "Danh sách đăng ký" → bấm Xác nhận cho volunteer.
5. Tab "Điểm danh" → chọn volunteer → nhập mã QR của event (hiển thị trên trang) → bấm Điểm danh.

### 5.6. Sponsor tài trợ
1. Đăng xuất organizer.
2. Đăng nhập `sponsor / sponsor123`.
3. Vào `/events` → mở "Test Service Split".
4. Gửi tài trợ (loại: Financial, số tiền: 100000, ghi chú: test).
5. Vào `/my-sponsorships` → thấy tài trợ vừa tạo.

### 5.7. Organizer hoàn thành event
1. Đăng xuất sponsor.
2. Đăng nhập `organizer / organizer123`.
3. Vào quản lý "Test Service Split" → bấm "Hoàn thành".
4. Trạng thái chuyển `Completed`.
5. Tab "Báo cáo" hiển thị số liệu.

### 5.8. Volunteer kiểm tra kết quả
1. Đăng xuất organizer.
2. Đăng nhập `volunteer / volunteer123`.
3. Vào `/my-certificates` → thấy chứng chỉ mới (nếu đã điểm danh).
4. Vào `/my-registrations` → event "Test Service Split" có nút đánh giá → đánh giá organizer.

**Kiểm tra đạt**: Tất cả bước trên không bị lỗi 404/500/502. Dữ liệu hiển thị đúng.

---

## Bước 6: Test tình huống mới (A-G) từ API

**Mục đích**: Xác nhận các endpoint mới hoạt động. Dùng Swagger hoặc Postman.

Swagger URL: `http://localhost:5003/swagger` (EventService) và `http://localhost:5004/swagger` (FinanceService).

### 6.1. Resubmit event bị reject (A)
1. Đăng nhập organizer, lấy token.
2. Tạo event mới qua `POST /api/events`.
3. Đăng nhập admin, gọi `PUT /api/events/{id}/reject`.
4. Đăng nhập organizer, gọi `POST /api/events/{id}/resubmit`.
5. **Kỳ vọng**: status chuyển về `Pending`.

### 6.2. Cancel event (B)
1. Tạo event → admin approve → volunteer đăng ký → organizer confirm.
2. Organizer gọi `PUT /api/events/{id}/cancel` với body `{ "reason": "Mưa bão" }`.
3. **Kỳ vọng**: event status = `Cancelled`, volunteer nhận notification.

### 6.3. Volunteer xin hủy sau confirm (B)
1. Tạo event → approve → volunteer đăng ký → organizer confirm.
2. Volunteer gọi `POST /api/events/{eventId}/register/cancel-request` với body `{ "reason": "Bận việc" }`.
3. **Kỳ vọng**: registration có `cancelRequested = true`.
4. Organizer gọi `PUT /api/events/{eventId}/registrations/{regId}/cancel`.
5. **Kỳ vọng**: registration status = `Cancelled`, volunteer nhận notification.

### 6.4. Walk-in (C)
1. Có event đang Approved.
2. Organizer gọi `POST /api/events/{eventId}/walk-in` với body `{ "volunteerUserId": 4, "note": "Walk-in" }`.
3. **Kỳ vọng**: registration tạo mới với status `Confirmed` và `isAttended = true`.

### 6.5. Bổ sung điểm danh + chỉnh giờ (C)
1. Có volunteer đã Confirmed nhưng chưa attended.
2. Organizer gọi `POST /api/events/{eventId}/registrations/{regId}/manual-attend` với body `{ "hours": 5 }`.
3. **Kỳ vọng**: `isAttended = true`, `volunteerHours = 5`.
4. Organizer gọi `PUT /api/events/{eventId}/registrations/{regId}/hours` với body `{ "hours": 7 }`.
5. **Kỳ vọng**: `volunteerHours = 7`.

### 6.6. Admin uncomplete (D)
1. Có event đã Completed.
2. Admin gọi `POST /api/events/{id}/uncomplete`.
3. **Kỳ vọng**: status = `Approved`, certificates của event bị xóa.

### 6.7. Rating moderation (D)
1. Có rating đã tạo.
2. Admin gọi `PUT /api/ratings/{id}/hide` với body `{ "reason": "Ngôn ngữ không phù hợp" }`.
3. **Kỳ vọng**: rating có `isHidden = true`.
4. Gọi `GET /api/users/{rateeId}/ratings` → rating bị ẩn không xuất hiện.

### 6.8. Sponsorship với actual amount (F)
1. Sponsor gửi offer → organizer accept.
2. Organizer gọi `PUT /api/sponsorship-proposals/{id}/received` với body `{ "actualReceivedAmount": 80000 }`.
3. **Kỳ vọng**: `actualReceivedAmount = 80000`, impact report dùng số này.

**Kiểm tra đạt**: Tất cả kỳ vọng đúng, không có lỗi 500.

---

## Bước 7: Thêm UI cho các action mới

**Mục đích**: Người dùng có thể thao tác các tình huống mới từ giao diện, không cần gọi API thủ công.

### 7.1. Nút "Hủy sự kiện" cho organizer

**File**: `BaseCore.WebClient/src/pages/organizer/ManageEvent.jsx`

**Vị trí**: Thêm nút ở header hoặc cuối trang quản lý event, chỉ hiện khi event đang `Approved` hoặc `Pending`.

**Logic**:
- Bấm nút → hiện modal nhập lý do hủy.
- Gọi `PUT /api/events/{id}/cancel` với body `{ reason }`.
- Thành công → redirect về `/my-events` hoặc hiển thị trạng thái mới.

**API call trong `api.js`**:
```javascript
cancelEvent: (eventId, reason) => api.put(`/events/${eventId}/cancel`, { reason }),
```

### 7.2. Nút "Gửi duyệt lại" cho organizer

**File**: `BaseCore.WebClient/src/pages/organizer/MyEvents.jsx`

**Vị trí**: Hiện nút khi event có status `Rejected`.

**Logic**:
- Bấm nút → gọi `POST /api/events/{id}/resubmit`.
- Thành công → status chuyển `Pending`, refresh danh sách.

**API call**:
```javascript
resubmitEvent: (eventId) => api.post(`/events/${eventId}/resubmit`),
```

### 7.3. Nút "Xin hủy đăng ký" cho volunteer

**File**: `BaseCore.WebClient/src/pages/volunteer/MyRegistrations.jsx`

**Vị trí**: Hiện nút khi registration status = `Confirmed` và event chưa `Completed`/`Cancelled`.

**Logic**:
- Bấm nút → hiện modal nhập lý do.
- Gọi `POST /api/events/{eventId}/register/cancel-request` với body `{ reason }`.
- Thành công → hiển thị badge "Đang chờ hủy".

**API call**:
```javascript
requestCancelRegistration: (eventId, reason) => api.post(`/events/${eventId}/register/cancel-request`, { reason }),
```

### 7.4. Nút "Đăng ký tại chỗ (Walk-in)" cho organizer

**File**: `BaseCore.WebClient/src/pages/organizer/ManageEvent.jsx`

**Vị trí**: Tab "Danh sách đăng ký" hoặc tab "Điểm danh", thêm nút "Walk-in".

**Logic**:
- Bấm nút → hiện modal chọn volunteer (dropdown danh sách user type=0) + ghi chú.
- Gọi `POST /api/events/{eventId}/walk-in` với body `{ volunteerUserId, note }`.
- Thành công → refresh danh sách, volunteer mới xuất hiện với trạng thái Confirmed + Attended.

**API call**:
```javascript
walkIn: (eventId, volunteerUserId, note) => api.post(`/events/${eventId}/walk-in`, { volunteerUserId, note }),
```

### 7.5. Nút "Bổ sung điểm danh" + "Chỉnh giờ" cho organizer

**File**: `BaseCore.WebClient/src/pages/organizer/ManageEvent.jsx`

**Vị trí**: Trong danh sách registration, mỗi volunteer Confirmed chưa attended có nút "Bổ sung điểm danh". Mỗi volunteer đã attended có input chỉnh giờ.

**Logic bổ sung điểm danh**:
- Bấm → gọi `POST /api/events/{eventId}/registrations/{regId}/manual-attend`.
- Có thể kèm input giờ optional.

**Logic chỉnh giờ**:
- Input số → bấm lưu → gọi `PUT /api/events/{eventId}/registrations/{regId}/hours` với body `{ hours }`.

**API calls**:
```javascript
manualAttend: (eventId, regId, hours) => api.post(`/events/${eventId}/registrations/${regId}/manual-attend`, { hours }),
adjustHours: (eventId, regId, hours) => api.put(`/events/${eventId}/registrations/${regId}/hours`, { hours }),
```

### 7.6. Nút "Mở lại sự kiện" cho admin

**File**: `BaseCore.WebClient/src/pages/admin/AdminEvents.jsx`

**Vị trí**: Hiện nút khi event status = `Completed`.

**Logic**:
- Bấm → confirm dialog "Mở lại sẽ thu hồi chứng chỉ đã cấp. Tiếp tục?"
- Gọi `POST /api/events/{id}/uncomplete`.
- Thành công → status chuyển `Approved`.

**API call**:
```javascript
uncompleteEvent: (eventId) => api.post(`/events/${eventId}/uncomplete`),
```

### 7.7. Rating moderation cho admin

**File**: Tạo mới `BaseCore.WebClient/src/pages/admin/AdminRatings.jsx` hoặc thêm vào `AdminEvents.jsx`.

**Logic**:
- Hiển thị danh sách rating (có thể filter theo event).
- Mỗi rating có nút "Ẩn" / "Hiện lại" / "Xóa".
- Gọi `PUT /api/ratings/{id}/hide`, `PUT /api/ratings/{id}/unhide`, `DELETE /api/ratings/{id}`.

**API calls**:
```javascript
hideRating: (id, reason) => api.put(`/ratings/${id}/hide`, { reason }),
unhideRating: (id) => api.put(`/ratings/${id}/unhide`),
deleteRating: (id) => api.delete(`/ratings/${id}`),
```

**Kiểm tra đạt**: Mỗi nút bấm được, gọi API thành công, UI cập nhật trạng thái mới mà không cần reload trang.

---

## Bước 8: Dọn AdminController link trùng (optional)

**Mục đích**: Tránh EventService và FinanceService expose endpoint admin không liên quan.

**Cách làm**:

1. Tạo file mới `BaseCore.APIService/Controllers/Admin/AdminEventController.cs`:
   - Move endpoint `GET /api/admin/export/events` và `GET /api/dashboard` vào đây.

2. Tạo file mới `BaseCore.APIService/Controllers/Admin/AdminFinanceController.cs`:
   - Move endpoint `GET /api/admin/finance/overview`, `GET /api/admin/finance/stale-donations`, `GET /api/admin/finance/unreported-campaigns`, `GET /api/admin/finance/open-proposals-past-event`, `GET /api/admin/export/finance` vào đây.

3. Sửa `.csproj`:
   - `BaseCore.EventService.csproj`: đổi link `AdminController.cs` thành `AdminEventController.cs`.
   - `BaseCore.FinanceService.csproj`: đổi link `AdminController.cs` thành `AdminFinanceController.cs`.

4. Build lại: `dotnet build BaseCore.sln`.

**Kiểm tra đạt**: Build sạch, swagger của EventService không còn endpoint `/api/admin/finance/*`, swagger của FinanceService không còn endpoint `/api/admin/export/events`.

---

## Bước 9: Build + commit cuối

```powershell
cd D:\FW\FW\BaseCore
dotnet build BaseCore.sln --no-incremental
cd BaseCore.WebClient
npm run build
cd ..
git add -A
git commit -m "feat: add UI for event lifecycle actions and cleanup admin controllers"
git push origin main
```

---

## Checklist tổng kết

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Merge branch vào main | ☐ |
| 2 | Sửa connection string EventService + FinanceService | ☐ |
| 3 | Build solution sạch | ☐ |
| 4 | Chạy 5 terminal, health check pass | ☐ |
| 5 | Demo workflow 1 vòng (tạo → duyệt → đăng ký → confirm → check-in → complete → cert) | ☐ |
| 6 | Test API tình huống A-G qua Swagger/Postman | ☐ |
| 7.1 | UI: Nút hủy sự kiện | ☐ |
| 7.2 | UI: Nút gửi duyệt lại | ☐ |
| 7.3 | UI: Nút xin hủy đăng ký | ☐ |
| 7.4 | UI: Nút walk-in | ☐ |
| 7.5 | UI: Bổ sung điểm danh + chỉnh giờ | ☐ |
| 7.6 | UI: Nút mở lại sự kiện (admin) | ☐ |
| 7.7 | UI: Rating moderation (admin) | ☐ |
| 8 | Dọn AdminController (optional) | ☐ |
| 9 | Build + commit cuối | ☐ |

---

## Ghi chú cho team

- **Ai làm gì**: Theo phân công trong `Context/VolunteerHub-team-service-split.md`:
  - Thành viên A (Identity): bước 7.3 (xin hủy liên quan đến volunteer UI).
  - Thành viên B (Event): bước 7.1, 7.2, 7.4, 7.5, 7.6.
  - Thành viên C (Finance): bước 7.7, 7.8 (nếu có UI finance mới), bước 8.
- **Khi sửa file chung** (`api.js`, `App.jsx`, `MainLayout.jsx`): báo nhóm trước.
- **Trước khi push**: luôn chạy `dotnet build BaseCore.sln` và `npm run build`.
- **Nếu gặp lỗi 502 qua gateway**: kiểm tra service tương ứng đã start chưa (xem port trong ocelot.json).
