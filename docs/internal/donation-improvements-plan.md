# Kế hoạch — Cải thiện nghiệp vụ quyên góp/ủng hộ (#3–#6)

> **Bối cảnh:** Giữ nguyên mục tiêu **thanh toán ngoài hệ thống** (đã có VietQR + mã đối soát ở #1/#2).
> **Phạm vi:** #3 Ghi nhận người ủng hộ · #4 Minh bạch công khai · #5 Tự động/nhắc việc · #6 Toàn vẹn.
> **Nguyên tắc:** Bám convention hiện tại (entity flat, status string, logic trong controller, migration qua `DesignTimeDbContextFactory`, notify qua `INotificationService.SendAsync`).

---

## 0. Hiện trạng đã rà (chốt)
- Quyên góp cá nhân: `SupportCampaign` + `IndividualDonation`; xác nhận tại `SupportCampaignController.ChangeDonationStatus` (line ~502), khi `status=="Confirmed"` set `ConfirmedBy/ConfirmedAt`.
- Badge: `Badge.Condition` là JSON `{"min_events":..,"min_hours":..}`; `BadgeService.CheckAndAwardAsync(userId)` chỉ tính `totalEvents` (attended) + `totalHours`. **Chưa có** điều kiện theo đóng góp.
- Công khai: `EventDetail.jsx` đã hiện `confirmedAmount`, tổng donation/sponsorship, report summary; query list campaign đã trả `publicDonors` (top 10 đã xác nhận) + `confirmedCount`.
- `AdminFinanceWatch` theo dõi khoản treo/chưa báo cáo. Có sẵn `EventService.AutoCompleteOverdueAsync()` (pattern tự động hoá).
- Không có scheduler/hosted service; nền chạy theo **queue-table + poller** (CertificateWorker).

---

## #3 — Ghi nhận người ủng hộ ★★★

### Mục tiêu
Người ủng hộ được **ghi nhận vào hồ sơ** + **huy hiệu nhà hảo tâm** + lời cảm ơn, khi khoản được **Xác nhận**.

### 3.1 Lưu thống kê đóng góp (denormalize)
`VolunteerProfile` thêm:
```csharp
public decimal TotalDonatedAmount { get; set; } = 0;  // tổng đã ủng hộ (Confirmed)
public int DonationCount { get; set; } = 0;            // số lần ủng hộ (Confirmed)
```
- Migration `AddDonorStats` (qua design-time factory).
- DbContext: `HasPrecision(18,2)` cho `TotalDonatedAmount`.

### 3.2 Cập nhật khi xác nhận / hoàn lại
Trong `ChangeDonationStatus` (controller Finance), sau khi set Confirmed:
```csharp
if (status == "Confirmed")
{
    var profile = await _context.VolunteerProfiles.FirstOrDefaultAsync(p => p.UserId == donation.UserId);
    if (profile != null)
    {
        // tính lại từ DB cho chắc chắn (idempotent)
        var agg = await _context.IndividualDonations
            .Where(d => d.UserId == donation.UserId && d.Status == "Confirmed")
            .GroupBy(d => 1)
            .Select(g => new { Sum = g.Sum(x => (decimal?)x.Amount) ?? 0, Cnt = g.Count() })
            .FirstOrDefaultAsync();
        profile.TotalDonatedAmount = agg?.Sum ?? 0;
        profile.DonationCount = agg?.Cnt ?? 0;
        await _context.SaveChangesAsync();
        await _badgeService.CheckAndAwardAsync(donation.UserId); // inject IBadgeService vào controller
    }
}
```
> Controller cần inject `IBadgeService` (đã có DI sẵn).

### 3.3 Mở rộng điều kiện huy hiệu (donation-based)
`BadgeService.CheckAndAwardAsync`: nạp thêm donor stats; `MeetsCondition` xử lý thêm khóa:
```csharp
// load:
var donor = await _context.VolunteerProfiles
    .Where(p => p.UserId == userId)
    .Select(p => new { p.TotalDonatedAmount, p.DonationCount })
    .FirstOrDefaultAsync();
// MeetsCondition thêm:
if (dict.TryGetValue("min_donated", out var md) && totalDonated < md) return false;
if (dict.TryGetValue("min_donations", out var mc) && donationCount < (int)mc) return false;
```
- Seed huy hiệu mới (vd "Nhà hảo tâm" `{"min_donations":1}`, "Mạnh thường quân" `{"min_donated":1000000}`).
- `AdminBadges.jsx` (form tạo huy hiệu): thêm loại điều kiện **theo đóng góp** (số tiền / số lần) bên cạnh min_events/min_hours.

### 3.4 Hồ sơ / Hộ chiếu tình nguyện
- API hồ sơ trả thêm `totalDonatedAmount`, `donationCount`.
- FE `Passport.jsx` / `Profile.jsx`: thẻ "Đã đóng góp **{money}** qua **{n}** lần". (Tab donations ở `Activity.jsx` đã liệt kê chi tiết — giữ nguyên.)

### 3.5 Lời cảm ơn / biên nhận (tùy chọn nhẹ)
- Notification xác nhận đã có; bổ sung câu cảm ơn + (tùy chọn) nút "Tải biên nhận" cảm ơn đơn giản (ảnh/PDF nhẹ như chứng chỉ). *Để cuối, không bắt buộc.*

### Files #3
| File | Thay đổi |
|------|----------|
| `VolunteerProfile.cs`, `MySqlDbContext.cs` | 2 field + config + migration |
| `SupportCampaignController.cs` | inject IBadgeService, cập nhật stats khi confirm |
| `BadgeService.cs` | điều kiện min_donated/min_donations |
| `AdminBadges.jsx` | form điều kiện đóng góp |
| `Passport.jsx`/`Profile.jsx` + API hồ sơ | hiển thị tổng đóng góp |

---

## #4 — Minh bạch công khai ★★ (đúng NFR "kết quả công khai")

### 4.1 Thanh tiến độ + danh sách người ủng hộ (EventDetail)
Dữ liệu đã có (`confirmedAmount`, `targetAmount`, `publicDonors`). Chỉ cần FE:
- **Progress bar** "Đã quyên góp {confirmed}/{target} ({%})" trên khối tài chính của `EventDetail.jsx` (và thẻ sự kiện nếu muốn).
- **Danh sách người ủng hộ đã xác nhận** (tôn trọng ẩn danh — backend đã map `displayName = IsAnonymous ? 'Ẩn danh' : ...`).

### 4.2 Nhãn minh bạch cho tổ chức
- Khi campaign `Reported`: hiện badge **"Đã báo cáo sử dụng"** + link xem báo cáo (đã có `reportSummary`/`expenseDetails`/`reportAttachmentUrl`).
- (Tùy chọn) "Điểm minh bạch" của organizer = tỉ lệ đợt đã báo cáo / tổng đợt đã đóng — hiển thị ở hồ sơ tổ chức.

### 4.3 (Tùy chọn) Public không cần đăng nhập
Đảm bảo `GET support-campaigns` cho sự kiện Approved/Completed trả `publicDonors` + tiến độ cho khách (đã có path public). Kiểm tra `PublicCampaignStatuses`.

### Files #4
| File | Thay đổi |
|------|----------|
| `EventDetail.jsx` | progress bar, list người ủng hộ, nhãn "Đã báo cáo" |
| (tùy chọn) hồ sơ tổ chức FE | điểm minh bạch |

> Chủ yếu FE — backend gần như đã sẵn dữ liệu.

---

## #5 — Tự động hoá & nhắc việc ★★

### 5.1 Tự đóng đợt hết hạn
Thêm `AutoCloseOverdueCampaignsAsync()` (mirror `AutoCompleteOverdueAsync`): campaign `Open` mà `EndDate < now` → `Status="Closed"`, notify tổ chức "Đợt … đã đóng, hãy báo cáo sử dụng".

### 5.2 Nhắc việc cho tổ chức
- Có **donation chờ xác nhận** quá X ngày → notify tổ chức.
- Đợt **Closed chưa Reported** → notify nhắc báo cáo.
(Phát qua `INotificationService.SendAsync`, type `CampaignReminder`.)

### 5.3 Cơ chế chạy (chọn 1)
- **(a) Trigger sẵn có:** gọi `AutoClose...` + quét nhắc việc trong cùng chỗ đang gọi `AutoCompleteOverdueAsync` (nếu đang gọi theo request/cron nhẹ). Đơn giản nhất.
- **(b) Hosted `BackgroundService`** quét mỗi N giờ (chuẩn .NET, không có sẵn — thêm mới, rủi ro TB).
- **(c) Queue-table + poller** như CertificateWorker (nặng).
→ **Khuyến nghị (a)** nếu đã có điểm gọi auto-complete; nếu chưa, làm **(b)** gọn.

### Files #5
| File | Thay đổi |
|------|----------|
| `EventService.cs` (hoặc service finance) | AutoClose + quét nhắc việc |
| chỗ trigger / Program.cs | đăng ký BackgroundService nếu chọn (b) |

---

## #6 — Toàn vẹn dữ liệu ★

### 6.1 Khóa sửa khoản đã xử lý
- `ChangeDonationStatus` đã chặn cập nhật khi `!= PendingConfirmation` ✅ (giữ).
- Đảm bảo **không** có đường cập nhật `Amount` sau khi Confirmed (rà các endpoint update donation — hiện chỉ có confirm/reject/cancel).

### 6.2 Hiển thị dấu vết
- FE danh sách donation (CampaignsTab): hiện **"Xác nhận bởi … lúc …"** (`confirmedBy`/`confirmedAt` đã trả về) cho minh bạch nội bộ.

### 6.3 Đối chiếu khi xác nhận
- Ở modal/nút Xác nhận: thêm ô tick **"Tôi đã đối chiếu sao kê ngân hàng"** (bắt buộc tick mới cho xác nhận) + ghi vào audit metadata. Nhắc tổ chức ảnh minh chứng do người góp tự upload, không phải bằng chứng giao dịch.

### Files #6
| File | Thay đổi |
|------|----------|
| `CampaignsTab.jsx` | hiện confirmedBy/At; ô tick đối chiếu trước khi xác nhận |
| `SupportCampaignController.cs` | (tùy chọn) ghi cờ đối chiếu vào audit |

---

## Sequencing & ước tính

| Hạng mục | Giá trị | Công sức | Phụ thuộc |
|----------|---------|----------|-----------|
| **#3** Ghi nhận người ủng hộ | ★★★ | TB (migration + BE + badge + FE hồ sơ) | — |
| **#4** Minh bạch công khai | ★★ | Thấp–TB (chủ yếu FE) | dữ liệu đã có |
| **#6** Toàn vẹn | ★ | Thấp (FE + ít BE) | — |
| **#5** Tự động/nhắc việc | ★★ | TB (cần chọn cơ chế chạy) | quyết định (a)/(b) |

**Thứ tự đề xuất:** #4 → #6 → #3 → #5.
Lý do: #4 và #6 nhẹ, đa phần FE, thấy kết quả ngay. #3 là trọng tâm động lực (migration + badge). #5 để cuối vì cần quyết định hạ tầng chạy nền.

---

## Lưu ý vận hành
- Mọi thay đổi BE cần **restart host phục vụ `/api/events` (EventService 5003)** + (với donation) host Finance nếu khác cổng — kiểm tra route ocelot cho `/api/support-campaigns` & `/api/donations` (cổng 5004 FinanceService theo recon).
- Migration tạo/áp qua `DesignTimeDbContextFactory` (`-p BaseCore.Repository -s BaseCore.Repository`), build host không cần thiết.

---

## Trạng thái
- **2026-05-27** — Lập kế hoạch.
- **2026-05-27** — Triển khai xong theo thứ tự #4 → #6 → #3 → #5. BE compile sạch, FE build sạch, 1 migration áp dụng.
- **#4 Minh bạch công khai:** ✅ EventDetail đã có progress bar + danh sách người ủng hộ (sẵn) + bổ sung nhãn "Đã báo cáo sử dụng" + nội dung báo cáo + % trên từng đợt.
- **#6 Toàn vẹn:** ✅ Hiện "Đã xác nhận lúc …" trong CampaignsTab; modal xác nhận có tick bắt buộc "đã đối chiếu sao kê" + cảnh báo ảnh minh chứng không phải bằng chứng giao dịch.
- **#3 Ghi nhận người ủng hộ:** ✅ `VolunteerProfile.TotalDonatedAmount/DonationCount` (migration `AddDonorStats`); `ChangeDonationStatus` cập nhật stats + `CheckAndAwardAsync` khi confirm; BadgeService thêm `min_donated`/`min_donations`; AdminBadges form điều kiện đóng góp; Passport hiện stat "Lần ủng hộ".
- **#5 Tự động/nhắc việc:** ✅ `AutoCloseOverdueCampaignsAsync` + `SendCampaignRemindersAsync` (đợt đã đóng chưa báo cáo; donation chờ >3 ngày) gắn vào endpoint admin `auto-complete-overdue` (cơ chế (a)).

**Lưu ý vận hành:** route `/api/support-campaigns` & `/api/donations` → **FinanceService (5004)**; `/api/events/*` → **EventService (5003)**. Cần restart 2 host này để nạp code mới (schema đã cập nhật). Admin chạy nút "auto-complete-overdue" sẽ đồng thời đóng đợt hết hạn + gửi nhắc việc.
