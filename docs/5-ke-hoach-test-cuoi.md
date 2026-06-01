# KẾ HOẠCH TEST CUỐI — VolunteerHub (UAT qua giao diện thực tế)

> Mục tiêu: kiểm thử **toàn bộ hệ thống bằng giao diện thật** trước khi nghiệm thu. Gồm kịch bản theo từng vai trò, kịch bản tổng thể (end-to-end), và các tình huống biên/âm (negative). Phạm vi: chức năng + nghiệp vụ + UI/UX + phân quyền + thông báo + tiếng Việt/encoding.

---

## 0. Chuẩn bị môi trường

### 0.1 Khởi động hệ thống
1. **LocalDB**: đảm bảo `MSSQLLocalDB` chạy. Nếu lỗi "process failed to start": kill `sqlservr.exe` + `dotnet.exe` cũ rồi `sqllocaldb start MSSQLLocalDB`.
2. **Backend (5 host)** — chạy đủ qua Visual Studio / `dotnet run`:
   - ApiGateway `:5000` · APIService `:5001` · AuthService `:5002` · EventService `:5003` · FinanceService `:5004`
   - ⚠️ **Nếu vừa sửa code BE phải restart host** thì thay đổi mới có hiệu lực.
3. **Frontend**: `cd BaseCore.WebClient && npm run dev` → mở `http://localhost:3000` (proxy `/api` → `:5000`).
4. **CertificateWorker (Rust)**: chạy nếu muốn test sinh PDF chứng chỉ thật.

### 0.2 Tài khoản seed (mật khẩu mặc định)
| Vai trò | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Nhà tổ chức (đã verified) | `organizer` | `organizer123` |
| Nhà tài trợ | `sponsor` | `sponsor123` |
| Tình nguyện viên (đã KYC) | `volunteer` | `volunteer123` |

> Nên tạo thêm tài khoản mới mỗi vai trò trong quá trình test để kiểm tra luồng "chưa xác minh / hồ sơ trống".

### 0.3 Quy ước
- **Mức ưu tiên**: P0 (chặn nghiệm thu) · P1 (quan trọng) · P2 (phụ).
- **Ghi kết quả**: ✅ Pass · ❌ Fail (ghi mã lỗi + ảnh) · ⏭️ Skip · ⚠️ Pass có lưu ý.
- Mỗi case kiểm cả: **kết quả nghiệp vụ** + **thông báo/UI** (đúng tiếng Việt, không có chữ rác) + **điều hướng** sau hành động.
- 🔴 **NGUYÊN TẮC CHẠY (BẮT BUỘC): chỉ được dừng lại khi đã chạy HẾT toàn bộ plan** (mục A → E + các kịch bản end-to-end B).
  - Gặp case **Fail/lỗi → GHI NHẬN vào bảng E rồi tiếp tục** case kế tiếp; **không dừng giữa chừng**, không bỏ qua phần còn lại.
  - Chỉ được dừng sớm trong **đúng 1 trường hợp**: lỗi hạ tầng chặn toàn hệ thống không thể test tiếp (vd BE/LocalDB không lên) — và phải **ghi rõ lý do dừng** + làm bước dọn dẹp 0.4.
  - Chạy xong hết plan → đối chiếu **tiêu chí nghiệm thu (mục E)** → **rồi mới** thực hiện dọn dẹp (mục 0.4).

### 0.4 Kết thúc & dọn dẹp — **BẮT BUỘC sau khi chạy xong plan**

> ⚠️ Phải **tắt host + giải phóng cổng + dừng LocalDB** sạch sau mỗi đợt test. Kinh nghiệm: chỉ tắt cửa sổ không đủ — tiến trình `dotnet.exe`/`sqlservr.exe` còn sống sẽ **giữ named pipe LocalDB** khiến lần chạy sau lỗi *"SQL Server process failed to start"* và cổng `5000–5004` báo vẫn bận.

**Quy trình dọn dẹp (theo thứ tự):**
1. **Dừng Frontend**: `Ctrl+C` ở cửa sổ `npm run dev`.
2. **Dừng 5 host BE**: `Ctrl+C` ở từng cửa sổ (Gateway/API/Auth/Event/Finance). Nếu chạy từ Visual Studio: **Stop Debugging** (Shift+F5) cho từng project, hoặc đóng IIS Express/giải pháp.
3. **Kill tiến trình còn sót** (PowerShell):
   ```powershell
   Get-Process dotnet -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
4. **Xác nhận cổng đã giải phóng** (rỗng = OK):
   ```
   netstat -ano | findstr "LISTENING" | findstr ":3000 :5000 :5001 :5002 :5003 :5004"
   ```
5. **Dừng LocalDB sạch**:
   ```
   sqllocaldb stop MSSQLLocalDB
   ```
   - Nếu treo / không dừng: `sqllocaldb stop MSSQLLocalDB -k` (force kill).
   - Nếu vẫn còn `sqlservr.exe` mồ côi (giữ lock file/pipe):
     ```powershell
     Get-Process sqlservr -ErrorAction SilentlyContinue | Stop-Process -Force
     ```

**Checklist xác nhận sạch (đánh dấu trước khi kết thúc đợt test):**
- [ ] Không còn `dotnet.exe` của 5 host (`Get-Process dotnet`).
- [ ] Không còn cổng `3000/5000/5001/5002/5003/5004` ở trạng thái LISTENING.
- [ ] LocalDB `MSSQLLocalDB` đã `Stopped` (hoặc `sqlservr.exe` đã thoát).

> ❗ KHÔNG "tắt cổng" bằng cách chỉ kill socket/đóng tab — phải **kết thúc đúng tiến trình**. Lần test sau khởi động lại theo mục **0.1**.

---

## A. KỊCH BẢN THEO VAI TRÒ

### A1. Khách (chưa đăng nhập)

| ID | Mức | Bước | Kết quả mong đợi |
|---|---|---|---|
| G-01 | P1 | Mở `/` (Landing) | Hero ấm (kem), ảnh collage + chip "giờ ghi nhận", dải stats, value props, sự kiện nổi bật, CTA. Không vỡ layout. |
| G-02 | P0 | Vào `/events` | Thấy danh sách sự kiện **Approved (chưa hết hạn) + Completed**; KHÔNG thấy Pending/Rejected/Cancelled. |
| G-03 | P1 | Tìm kiếm + lọc danh mục, chuyển Lưới/Bản đồ, "Gần tôi" | Filter pill hoạt động; bản đồ hiện marker; "Gần tôi" xin định vị + lọc bán kính. |
| G-04 | P1 | Mở chi tiết 1 sự kiện | Trang 2 cột; nút "Đăng nhập để đăng ký"; hiện đủ thông tin, kỹ năng, tiến độ. |
| G-05 | P1 | Bấm "Đăng ký ngay" trong khi chưa đăng nhập | Điều hướng `/login` (không cho đăng ký). |
| G-06 | P1 | `/verify/check` + nhập mã chứng chỉ | Tra cứu được chứng chỉ hợp lệ / báo không tìm thấy. |
| G-07 | P0 | Truy cập thẳng `/dashboard`, `/admin/users` khi chưa login | Bị chặn → về `/login`. |
| G-08 | P2 | Đăng ký tài khoản mới (`/register`) chọn từng vai trò | Split-screen; chọn 1 trong 3 vai trò; mật khẩu < 8 ký tự → báo lỗi; tạo xong → về login. |
| G-09 | P2 | Vào `/register?role=sponsor` từ Landing | Vai trò "Nhà tài trợ" được chọn sẵn. |

### A2. Tình nguyện viên (Volunteer)

| ID | Mức | Bước | Kết quả mong đợi |
|---|---|---|---|
| V-01 | P0 | Đăng nhập `volunteer/volunteer123` | Vào `/dashboard`; sidebar sáng ấm; menu đúng vai trò. |
| V-02 | P1 | Xem Trang chủ | Eyebrow + "Chào … 👋"; **4 stat card** (Giờ/Sự kiện/Huy hiệu/Chứng chỉ) số thật; mục "Hôm nay" (việc cần làm); "Sự kiện đề xuất"; card "Hộ chiếu tình nguyện". |
| V-03 | P0 | `/events` → mở 1 sự kiện Approved → "Đăng ký ngay" → chọn ca → xác nhận | Modal xác nhận → thành công; đăng ký xuất hiện ở `/activity` trạng thái "Chờ duyệt". |
| V-04 | P1 | Đăng ký sự kiện yêu cầu KYC khi **chưa** KYC | Bị chặn + thông báo cần hoàn tất KYC. |
| V-05 | P1 | `/activity` tab Đăng ký | Hàng có ảnh sự kiện 64px + badge trạng thái + meta; nút theo trạng thái (Điểm danh/Xin hủy/Đánh giá). |
| V-06 | P0 | Khi sự kiện đang diễn ra → "Điểm danh" | Mở modal điểm danh (GPS) **hoặc** quét QR; điểm danh xa vị trí → báo lỗi tiếng Việt rõ. |
| V-07 | P1 | Sự kiện hoàn thành → đánh giá BTC (chọn sao + nhận xét) → sửa lại | Lưu đánh giá; sửa được; hiển thị "Đã gửi đánh giá". |
| V-08 | P1 | Phỏng vấn (sự kiện yêu cầu phỏng vấn) | Thấy lịch + link "Vào phòng họp" + "Thêm vào lịch" (Google Calendar). |
| V-09 | P0 | `/profile` (Hồ sơ) → đổi **Họ và tên** + SĐT → Lưu | Lưu thành công; **tên cập nhật ngay** ở hero + sidebar/topbar (không cần đăng nhập lại). |
| V-10 | P1 | Đổi ảnh đại diện qua **nút camera** trên avatar | Mở cropper → căn → lưu; avatar chỉ hiện **1 chỗ** (không trùng). |
| V-11 | P1 | Hồ sơ: cập nhật Nhóm máu/Sở thích/Giới thiệu; thanh "Hoàn thiện hồ sơ" | % + danh sách mục còn thiếu cập nhật đúng; KHÔNG còn ô "Ngôn ngữ". |
| V-12 | P1 | Gửi KYC (CCCD trước/sau + chân dung) | Chuyển "Chờ xác minh"; KHÔNG hiện ghi chú admin khi đã Verified ("Seed verified" không xuất hiện). |
| V-13 | P1 | Thêm kỹ năng + gửi minh chứng | Kỹ năng "Tự khai"/"Chờ xác minh" đúng theo có/không minh chứng. |
| V-14 | P1 | `/achievements` tab Huy hiệu / Chứng chỉ | Huy hiệu earned/locked (khóa mờ); chứng chỉ mở **PDF** + verify + share. |
| V-15 | P1 | `/profile` tab Hành trình (Passport) | Hero + stats + timeline + danh sách chứng chỉ (click mở PDF). |
| V-16 | P2 | Hủy đăng ký / xin hủy | Pending → rút được; Confirmed → "Xin hủy", BTC duyệt. |

### A3. Nhà tổ chức (Organizer)

| ID | Mức | Bước | Kết quả mong đợi |
|---|---|---|---|
| O-01 | P0 | Đăng nhập `organizer/organizer123` | Dashboard organizer; menu đủ (Sự kiện của tôi, Tạo sự kiện, Báo cáo, Xác minh tổ chức…). |
| O-02 | P1 | `/organizer/verification` (Hồ sơ tổ chức) | Hero logo + badge trạng thái + **mini-stats chỉ đếm sự kiện Approved/Completed**; mốc Gửi/Duyệt. |
| O-03 | P1 | Sửa **logo** rồi Lưu | Nút "Lưu thay đổi"; **giữ Verified** (không bắt duyệt lại); không đòi tài liệu. |
| O-04 | P1 | Sửa **tên tổ chức / người đại diện / tài liệu** | Cảnh báo + confirm → chuyển "Chờ admin duyệt"; bắt buộc có ảnh tài liệu minh chứng. |
| O-05 | P0 | `/events/create` — wizard 6 bước | Stepper; validate từng bước; chọn vị trí bản đồ + autocomplete địa chỉ; gợi ý thời lượng. |
| O-06 | P1 | Tạo sự kiện với **ngày bắt đầu < 1 giờ tới** | Bị chặn (lead-time ≥1h) ngay tại FE. |
| O-07 | P1 | Tạo sự kiện **thời lượng > 30 ngày** | Bị chặn (max duration). |
| O-08 | P0 | Gửi duyệt sự kiện | Trạng thái "Chờ duyệt"; xuất hiện ở `/my-events` và phía Admin. |
| O-09 | P1 | Sửa **tiêu đề/mô tả** sự kiện đã Approved | Cảnh báo → chuyển về **Pending** (ẩn khỏi public, chờ duyệt lại) + thông báo. |
| O-10 | P1 | Sửa **ảnh/thời gian/địa điểm** sự kiện Approved | Giữ Approved; đổi thời gian/địa điểm → **thông báo cho TNV**. |
| O-11 | P0 | `/events/:id/manage` — tab Đăng ký | Duyệt/từ chối/đổi ca/walk-in; phỏng vấn (hẹn + chấm Đạt/Không). |
| O-12 | P0 | Tab Điểm danh | Hiện QR cho TNV quét + điểm danh GPS cho người đã xác nhận. |
| O-13 | P1 | Tab Ca làm việc | Thêm/sửa ca trong khung giờ sự kiện; chặn ca ngoài khung. |
| O-14 | P1 | Tab Kêu gọi ủng hộ | Tạo đợt; xác nhận/từ chối khoản ủng hộ (tick đối chiếu sao kê); báo cáo tài chính. |
| O-15 | P1 | Tab Tài trợ doanh nghiệp | Nhận/từ chối đề nghị; ghi nhận số tiền thực nhận; gửi báo cáo sử dụng. |
| O-16 | P0 | **"Hoàn thành" sự kiện trước khi kết thúc** | Nút **disable** + tooltip "Chỉ hoàn thành sau khi kết thúc". |
| O-17 | P0 | Hoàn thành sự kiện đã kết thúc → chọn người tham gia | Cấp chứng chỉ + cộng giờ; **người đã xin hủy KHÔNG bị tính** ("Ghi nhận tất cả" cũng loại). |
| O-18 | P1 | `/organizer/insights` (Báo cáo tác động) | Stat cards + biểu đồ (có sắc **coral** trong data-viz) + phễu tham gia (nhãn "Điểm danh / Đã xác nhận"). |
| O-19 | P1 | Thông báo organizer (chuông) | Bấm → điều hướng đúng (sự kiện → manage; tài trợ → manage?tab=corporate; verification → /organizer/verification). Không có chữ rác. |

### A4. Nhà tài trợ (Sponsor)

| ID | Mức | Bước | Kết quả mong đợi |
|---|---|---|---|
| S-01 | P0 | Đăng nhập `sponsor/sponsor123` → Dashboard | 3 thẻ thật: **Tổng đã ghi nhận (tiền)** / Đang chờ phản hồi / Tổng đề nghị; banner "đang chờ" nếu có → link lọc. |
| S-02 | P0 | `/events` → mở sự kiện Approved/Completed → "Đề nghị tài trợ" | Modal mở; chọn sự kiện; nhập số tiền/tiêu đề/nội dung; gửi. |
| S-03 | P1 | Vào từ EventDetail (`?eventId=`) với sự kiện ngoài top-100 | Sự kiện vẫn hiện trong select + preview (đã fetch bổ sung). |
| S-04 | P1 | `/my-sponsorships` lọc theo trạng thái | Tabs Tất cả/Chờ/Chấp nhận/Đã nhận/Đóng; số "Đề nghị" hiển thị **số đề xuất** (không nhầm số thực nhận). |
| S-05 | P1 | Nhận lời mời (OrganizerRequest) → **Chấp nhận** | Có **confirm**; message gửi BTC bằng **tiếng Việt** (không "Sponsor accepted"). |
| S-06 | P1 | **Hủy** đề nghị đang chờ | Có confirm trước khi hủy. |
| S-07 | P1 | Đề nghị ở trạng thái Đã nhận/Đã báo cáo | Thấy link **"Xem tác động & minh bạch của sự kiện"** + xem báo cáo sử dụng. |
| S-08 | P1 | `/sponsor/profile` | Hero + 3 stats khớp với MySponsorships; sửa hồ sơ lưu được. |

### A5. Quản trị viên (Admin)

| ID | Mức | Bước | Kết quả mong đợi |
|---|---|---|---|
| AD-01 | P0 | Đăng nhập `admin/admin123` → Dashboard | 5 stat cards + khối **"Hàng chờ xử lý"** (sự kiện chờ duyệt/hồ sơ tổ chức/KYC/kỹ năng/ủng hộ treo/chứng chỉ lỗi&chờ) → click sang trang xử lý. |
| AD-02 | P0 | `/admin/events` tab "Đã duyệt" | **Thấy cả sự kiện đã quá hạn** (để xử lý) — không bị ẩn. |
| AD-03 | P0 | Duyệt / Từ chối (lý do ≥10 ký tự) / Hủy / Chuyển tổ chức / Mở lại | Sau mỗi thao tác **danh sách refetch**, hàng rời tab cũ; trạng thái đúng theo BE (không hardcode). |
| AD-04 | P1 | Nút **"Hoàn thành sự kiện quá hạn"** | Gọi auto-complete; báo số sự kiện đã xử lý; danh sách reload. |
| AD-05 | P0 | `/admin/users` — tabs vai trò, tìm kiếm, lọc trạng thái, **phân trang** | Phân trang chạy đúng (trước/sau/nhảy trang). |
| AD-06 | P0 | **"Tạo tài khoản"** (nút + modal) | Tạo user mới (username/mật khẩu≥8/email/vai trò); trùng username/email → báo lỗi; tạo xong reload. |
| AD-07 | P1 | Sửa tài khoản | Modal chỉ sửa **thông tin liên hệ** (không còn checkbox khóa/mở); lưu KHÔNG đổi trạng thái. |
| AD-08 | P0 | Khóa/Mở tài khoản (nút trong danh sách) | Khóa → hủy sự kiện/đợt kêu gọi liên quan + thông báo (cascade). |
| AD-09 | P1 | Xóa tài khoản | Chỉ xóa được khi chưa có dữ liệu nghiệp vụ; admin không tự xóa/khóa mình; không xóa admin khác. |
| AD-10 | P0 | `/admin/verifications` — Duyệt **tổ chức** | Nút "Duyệt" **chỉ hiện khi PendingVerification**; reject/bổ sung yêu cầu note ≥10 ký tự. |
| AD-11 | P0 | Duyệt **KYC / kỹ năng** tình nguyện viên | Approve/Bổ sung/Từ chối; đổi tab không còn banner "đã cập nhật" cũ đọng lại. |
| AD-12 | P1 | `/admin/ratings` — kiểm duyệt đánh giá + **phân trang** | Ẩn/xóa đánh giá; phân trang chạy đúng. |
| AD-13 | P1 | `/admin/catalog` — Danh mục / Kỹ năng / Huy hiệu | CRUD chạy; huy hiệu **chỉ điều kiện quyên góp** vẫn tạo được. |
| AD-14 | P1 | `/admin/finance` — Đối soát | Chỉ-xem; **1 mục API lỗi không làm trắng cả trang** (banner cảnh báo). |
| AD-15 | P1 | `/admin/monitoring` — Giám sát | Logs + phân trang; cert job lỗi/chờ. |
| AD-16 | P1 | `/admin/export` — Xuất CSV/JSON | Tải file; khi BE lỗi (vd vượt số dòng) → **hiện message thật**, không chỉ "thất bại". |

---

## B. KỊCH BẢN TỔNG THỂ (END-TO-END)

### B1. Vòng đời 1 sự kiện qua 4 vai trò (happy path) — **P0**
1. **Organizer** tạo sự kiện (có ca, yêu cầu kỹ năng) → gửi duyệt.
2. **Admin** duyệt sự kiện → sự kiện lên public.
3. **Sponsor** mở sự kiện → gửi đề nghị tài trợ.
4. **Organizer** nhận đề nghị → chấp nhận → (sau đó) ghi nhận số tiền thực nhận.
5. **Volunteer** tìm sự kiện (gợi ý theo kỹ năng) → đăng ký → chọn ca.
6. **Organizer** duyệt đăng ký; (nếu yêu cầu phỏng vấn) hẹn + chấm Đạt.
7. Đến giờ: **Volunteer** điểm danh (QR/GPS); **Organizer** xác nhận.
8. Sau khi kết thúc: **Organizer** "Hoàn thành" → hệ thống **cấp chứng chỉ + cộng giờ**.
9. **Volunteer**: nhận thông báo, xem chứng chỉ (PDF) + huy hiệu, đánh giá BTC.
10. **Organizer** gửi báo cáo sử dụng tài trợ; **Sponsor** xem báo cáo + tác động.
11. **Admin** xem Dashboard: số liệu cập nhật; xuất dữ liệu.
- ✔️ Kiểm: mỗi bước có **thông báo đúng tiếng Việt** cho đúng người, điều hướng đúng.

### B2. Luồng quyên góp cá nhân — **P1**
Organizer tạo đợt kêu gọi (VietQR) → Volunteer/khách chuyển khoản & khai báo → Organizer đối chiếu sao kê → xác nhận/từ chối → minh bạch hiển thị công khai ở trang sự kiện.

### B3. Luồng xác minh tổ chức — **P1**
Tài khoản organizer mới (chưa verified) → bị chặn tạo sự kiện → nộp hồ sơ + tài liệu → Admin "Bổ sung" (note≥10) → organizer bổ sung → Admin duyệt → tạo được sự kiện.

### B4. Luồng KYC + kỹ năng — **P1**
Volunteer mới → đăng ký sự kiện yêu cầu KYC bị chặn → nộp KYC → Admin duyệt → đăng ký được. Thêm kỹ năng + minh chứng → Admin duyệt → kỹ năng "Đã xác minh".

---

## C. TÌNH HUỐNG BIÊN / ÂM (Negative & Edge) — **P0/P1**

### C1. Phân quyền & phiên
| ID | Tình huống | Mong đợi |
|---|---|---|
| N-01 | Volunteer truy cập thẳng `/admin/*`, `/events/create` | Chặn / redirect. |
| N-02 | Sửa URL `/events/:id/manage` của sự kiện **không phải của mình** (organizer khác) | BE 403, không lộ dữ liệu. |
| N-03 | Token hết hạn / BE tắt giữa chừng | App không "giả đăng nhập"; verify `me()` fail → về login. |
| N-04 | Gọi thẳng `PUT/DELETE /api/users/{id}` (cửa hậu cũ) | **404/không tồn tại** (đã gỡ); chỉ `/api/admin/users` có guard. |

### C2. Nghiệp vụ sự kiện
| ID | Tình huống | Mong đợi |
|---|---|---|
| N-05 | Đăng ký khi sự kiện **đã đủ chỗ** | Bị chặn "đã đủ người". |
| N-06 | Điểm danh **quá sớm / quá muộn** so với khung giờ ca | Thông báo khung giờ tiếng Việt rõ. |
| N-07 | Điểm danh **quá xa vị trí** (ngoài bán kính) | Báo lỗi GPS tiếng Việt. |
| N-08 | Organizer hoàn thành khi **chưa có ai được ghi nhận** | Cảnh báo "sẽ không cấp chứng chỉ". |
| N-09 | Đổi thời gian sự kiện khiến **ca nằm ngoài khung** | Bị chặn nêu tên ca. |
| N-10 | Gợi ý sự kiện cho Volunteer | KHÔNG gợi ý sự kiện **đã hết hạn**. |

### C3. Tài trợ / tài chính
| ID | Tình huống | Mong đợi |
|---|---|---|
| N-11 | Sponsor gửi số tiền ≤ 0 / tiêu đề < 3 ký tự | Validate chặn. |
| N-12 | Xác nhận donation **chưa tick** đối chiếu sao kê | Chặn + nhắc tick. |
| N-13 | Báo cáo dùng tiền > số đã nhận | Chặn. |

### C4. Hồ sơ / xác minh
| ID | Tình huống | Mong đợi |
|---|---|---|
| N-14 | Volunteer để **tên trống** rồi Lưu hồ sơ | Chặn "Họ và tên không được để trống". |
| N-15 | Admin từ chối hồ sơ tổ chức với lý do **< 10 ký tự** | Chặn cả FE lẫn BE. |
| N-16 | Tổ chức đã Verified, `kycAdminNote`/note seed | KHÔNG hiển thị note nội bộ khi đã Verified. |

### C5. Dữ liệu & hiển thị
| ID | Tình huống | Mong đợi |
|---|---|---|
| N-17 | Tất cả **thông báo** (đăng ký, điểm danh, walk-in, ghi nhận giờ, tài trợ, duyệt…) | Hiển thị **tiếng Việt đúng**, KHÔNG có chữ rác/mojibake. |
| N-18 | RegistrationsTab/AdminRatings/AdminEvents/AdminUsers ở trang cuối rồi xóa bớt | Không hiện **bảng trắng**; tự kẹp trang. |
| N-19 | Mini-stats organizer / Dashboard "TNV" | Đếm đúng (chỉ Approved/Completed; TNV **distinct** không trùng lượt). |

---

## D. CROSS-CUTTING

| ID | Mức | Hạng mục | Mong đợi |
|---|---|---|---|
| X-01 | P1 | **Giao diện redesign** | Toàn app nền kem ấm, font Be Vietnam Pro, nút/card/badge nhất quán; không còn xám lạnh lạc tông. |
| X-02 | P1 | **Sidebar/topbar** | Sidebar sáng ấm, active xanh; topbar blur; badge thông báo. |
| X-03 | P1 | **Responsive** | Mobile: sidebar → tab/menu; lưới 1 cột; modal dạng bottom-sheet; hit target ≥44px. |
| X-04 | P1 | **Điều hướng thông báo** | Mỗi loại notification dẫn đúng trang theo vai trò; có icon đúng. |
| X-05 | P2 | **Tải/empty/lỗi** | Skeleton/spinner khi tải; empty state có CTA; lỗi hiện message rõ (không nuốt lỗi). |
| X-06 | P2 | **Đa trình duyệt** | Chrome + 1 trình duyệt khác (Edge/Firefox). |

---

## E. BẢNG THEO DÕI KẾT QUẢ (template)

| ID case | Mức | Người test | Kết quả | Ghi chú / mã lỗi | Ảnh |
|---|---|---|---|---|---|
| G-01 | P1 | | | | |
| … | | | | | |

### Tiêu chí nghiệm thu
- **100% P0 Pass**; **≥95% P1 Pass**; không còn lỗi chặn luồng chính (B1).
- Không còn mojibake (N-17), không lộ quyền (N-01..N-04), phân trang & số liệu đúng (N-18, N-19).

---

## Phụ lục — Gợi ý thứ tự test
1. Smoke nhanh: G-01,02,07 · đăng nhập 4 vai trò (V-01/O-01/S-01/AD-01).
2. End-to-end B1 (xuyên suốt 4 vai trò) — quan trọng nhất.
3. Chức năng sâu từng vai trò (mục A).
4. Negative/biên (mục C).
5. Cross-cutting (mục D) + regression các lỗi vừa sửa (đánh dấu ⟲ ở: V-09, O-09/16/17, S-01/05, AD-02/03/06/10, N-04/10/17/18/19).
