# 8. Kế hoạch seed dữ liệu demo (hệ thống lớn, đa dạng)

> Mục tiêu: tạo một bộ dữ liệu **phong phú, thực tế** cho VolunteerHub để demo/test toàn hệ thống
> (đặc biệt là Knowledge Graph gợi ý). Dữ liệu nằm trong **SQL Server container** (volume `mssql_data`),
> bền qua restart, chỉ mất khi `docker compose down -v`. Có thể **seed dần theo pha**.

---

## 8.1. Cơ chế seed — chọn cách nào?

| Cách | Ưu | Nhược | Kết luận |
|---|---|---|---|
| **A. C# Demo Seeder** (endpoint admin, dùng EF) | Tái dùng **hàm băm mật khẩu** (tài khoản đăng nhập được), tôn trọng FK, **idempotent**, re-run, có thể auto rebuild graph | Phải viết code seeder | ⭐ **Đề xuất** |
| B. SQL script (`docker exec sqlcmd`) | Nhanh, bulk lớn | Băm mật khẩu khó (User có `Password`+`Salt`), tự lo identity/FK, dễ sai tên cột | Hợp cho bulk thuần, không hợp tạo user |
| C. Gọi API tuần tự | Giống thật 100% | Chậm, vướng rate-limit + luồng nghiệp vụ (duyệt sự kiện, check-in) | Không hợp khối lượng lớn |

**Vì sao A:** điểm chặn lớn nhất là **User cần đăng nhập được** → phải băm `Password`+`Salt` đúng cách hệ đang dùng.
Chỉ C# seeder (tái dùng `BaseCore` auth utils) làm sạch việc này. Đồng thời nó tránh được luồng nhiều bước
(sự kiện Pending→Approved, đăng ký→check-in→giờ công) vì ghi thẳng trạng thái cuối qua EF.

### Thiết kế seeder (cách A)
- **Endpoint:** `POST /api/admin/dev/seed?scale=medium` — chỉ **Admin**, chỉ bật khi
  `ASPNETCORE_ENVIRONMENT != Production` **hoặc** cờ `Demo:SeedEnabled=true` (an toàn, không lộ ở prod).
- **Idempotent:** mọi bản ghi demo mang dấu nhận biết (username prefix `demo.`, hoặc cột/ghi chú đánh dấu).
  Chạy lại → bỏ qua cái đã có, chỉ thêm cái thiếu.
- **Dọn dẹp:** `POST /api/admin/dev/seed/clear` — xóa toàn bộ dữ liệu demo (theo dấu nhận biết), **không đụng**
  4 tài khoản seed gốc và dữ liệu thật.
- **Tự rebuild graph** sau khi seed xong (gọi `GraphSyncService.FullSyncAsync`).
- **Seed dần:** nhận tham số `?phase=users|events|registrations|finance|ratings|all` để chạy từng pha.

---

## 8.2. Quy mô (scale)

| scale | Volunteer | Organizer | Sponsor | Sự kiện | Đăng ký | Quyên góp |
|---|---|---|---|---|---|---|
| `small` | 20 | 4 | 5 | 25 | ~150 | ~60 |
| `medium` ⭐ | 50 | 8 | 10 | 60 | ~450 | ~150 |
| `large` | 100 | 15 | 20 | 120 | ~1000 | ~350 |

> Đề xuất **medium**: đủ giàu để graph cho gợi ý ý nghĩa, vẫn nhẹ cho máy/đồ án.

---

## 8.3. Thành phần dữ liệu & độ đa dạng

### 8.3.1. Dữ liệu nền (đảm bảo tồn tại, không trùng)
- **Skills** (~20): nhóm theo lĩnh vực để tạo "cụm" — ví dụ
  *Sơ cứu, Điều dưỡng* (Y tế); *Dạy học, Tiếng Anh, Tin học* (Giáo dục);
  *Trồng cây, Phân loại rác* (Môi trường); *MC, Nhiếp ảnh, Truyền thông* (Sự kiện);
  *Lái xe, Hậu cần, Nấu ăn* (Hỗ trợ)...
- **EventCategories / lĩnh vực** (~8): Môi trường, Giáo dục, Y tế, Cộng đồng, Thiên tai – Cứu trợ,
  Trẻ em, Người cao tuổi, Động vật.

### 8.3.2. Người dùng
- **Volunteer (50):** tên tiếng Việt thật; hồ sơ đa dạng:
  - KYC: ~60% `Verified`, ~25% `PendingVerification`, ~15% `Unverified`.
  - Mỗi người **2–5 kỹ năng**, ~50% `Verified` (còn lại SelfDeclared/Pending).
  - `Interests`, `Bio`, giờ công (`TotalVolunteerHours`) suy ra từ tham gia thực.
- **Organizer (8):** kèm `OrganizerVerification` (đa số đã duyệt, vài cái pending) + logo.
- **Sponsor (10):** kèm `SponsorProfile`; có **lịch sử tài trợ theo lĩnh vực** (quan trọng cho gợi ý nhà tài trợ).

### 8.3.3. Sự kiện (60) — đa trạng thái, đa thời gian
| Trạng thái | Số lượng | Thời gian | Ghi chú |
|---|---|---|---|
| `Completed` | 25 | quá khứ | có người tham gia + giờ công + đánh giá + chứng chỉ |
| `Approved` | 20 | tương lai | **dùng cho gợi ý**; có `RequiredSkillIds` |
| `Pending` | 8 | tương lai | chờ admin duyệt |
| `Rejected` | 4 | — | có `RejectReason` |
| `Cancelled` | 3 | — | có `CancelReason` |

Mỗi sự kiện: thuộc 1 lĩnh vực, do 1 organizer tạo, `RequiredSkillIds` (1–3 kỹ năng **thuộc lĩnh vực đó**),
toạ độ (lat/lng) ở các thành phố VN (Hà Nội, HCM, Đà Nẵng, Huế, Cần Thơ…), min/max participants,
một số bật `RequiresKyc`/`RequiresInterview`.

### 8.3.4. Quan hệ tham gia & tài chính
- **Registrations (~450):** sự kiện Completed → nhiều `Confirmed`+`IsAttended` (có `VolunteerHours`);
  sự kiện Approved → trộn `Pending`/`Confirmed` (chưa attended).
- **EventSponsors (~40):** sponsor tài trợ sự kiện (ưu tiên Completed/Approved), `ContributionType` + `Amount`.
- **SupportCampaigns (~15)** gắn sự kiện + **IndividualDonations (~150)** (đa số `Confirmed`, vài ẩn danh).
- **Ratings (~200):** sau sự kiện Completed — organizer↔volunteer, điểm 3–5, vài cái bị ẩn.
- **Certificates:** cho volunteer đã attended ở sự kiện Completed (ghi thẳng, **không** enqueue job Rust để khỏi spam worker — hoặc tùy chọn enqueue vài cái để demo PDF).
- **Badges/UserBadges:** gán vài huy hiệu theo cột mốc giờ công/quyên góp.

### 8.3.5. Thiết kế CHO graph "giàu" (điểm mấu chốt)
Để 4 truy vấn gợi ý đều ra kết quả ý nghĩa:
1. **Trùng kỹ năng:** đảm bảo nhiều volunteer có kỹ năng = `RequiredSkillIds` của sự kiện **Approved sắp tới**
   → *Gợi ý sự kiện cho volunteer* sáng đèn.
2. **Cụm lĩnh vực:** volunteer tham gia nhiều sự kiện cùng lĩnh vực → gợi ý theo lĩnh vực + *TNV phù hợp cho sự kiện*.
3. **Đồng tham gia:** tạo vài "nhóm" volunteer cùng xuất hiện ở nhiều sự kiện Completed → *TNV tương tự* có kết quả.
4. **Lịch sử nhà tài trợ:** mỗi sponsor tài trợ tập trung 1–2 lĩnh vực → *Gợi ý nhà tài trợ cho sự kiện* theo lĩnh vực.

---

## 8.4. Thứ tự seed (tôn trọng khóa ngoại)
```
1. Skills, EventCategories        (nền)
2. Users (organizer/sponsor/volunteer) + Profiles + OrganizerVerification + SponsorProfile
3. VolunteerSkills
4. Events
5. Registrations (+ attendance + VolunteerHours cho Completed)
6. EventSponsors
7. SupportCampaigns → IndividualDonations
8. Ratings
9. Badges/UserBadges, Certificates (tùy chọn)
10. Cập nhật thống kê hồ sơ (TotalVolunteerHours/TotalDonatedAmount) + Rebuild graph
```

### Phân pha (seed dần)
- **Pha 1 — `users`**: nền + người dùng + kỹ năng + hồ sơ. (xong là login thử được nhiều tài khoản)
- **Pha 2 — `events`**: sự kiện đa trạng thái.
- **Pha 3 — `registrations`**: đăng ký + điểm danh + giờ công.
- **Pha 4 — `finance`**: tài trợ + chiến dịch + quyên góp.
- **Pha 5 — `ratings`**: đánh giá + chứng chỉ + huy hiệu.
- **Pha 6 — `all`/rebuild**: chốt thống kê + đồng bộ graph.

---

## 8.5. Tính an toàn & tái lập
- **Chỉ Admin + non-Production** mới gọi được seeder (tài khoản demo có mật khẩu biết trước → không để lộ ở prod).
- **Mật khẩu demo thống nhất** (vd `demo123`) cho mọi tài khoản demo, username dạng `demo.vol01`, `demo.org01`, `demo.spon01` → dễ đăng nhập thử.
- **Idempotent**: chạy lại không nhân đôi.
- **Clear**: xóa sạch theo dấu `demo.` khi cần làm lại.
- Dữ liệu thật + 4 tài khoản gốc (admin/organizer/sponsor/volunteer) **không bị đụng**.

## 8.6. Rủi ro & lưu ý
- **Chứng chỉ**: tránh enqueue hàng loạt `CertificateJobs` (worker Rust sẽ sinh hàng loạt PDF). Mặc định ghi
  `Certificate` trực tiếp, để `PdfUrl` rỗng; chỉ enqueue vài cái nếu muốn demo PDF.
- **Khối lượng lớn**: `large` tạo ~1000 đăng ký — seed theo pha + transaction để nhanh.
- **Thời gian**: ngày sự kiện đặt quanh mốc hiện tại (2026-06) để phần "sắp tới/đã qua" hợp lý.
- **Toạ độ**: dùng lat/lng thật của các thành phố để bản đồ hiển thị đẹp.

---

## 8.7. Sau khi seed — kiểm chứng
1. `GET /api/admin/graph/health` → `nodes`/`relationships` tăng mạnh.
2. Đăng nhập `demo.vol01/demo123` → trang chủ hiện khối **"Gợi ý cho bạn"**.
3. Đăng nhập organizer → gọi `/api/recommendations/events/{id}/volunteers` & `/sponsors` ra kết quả.
4. Bản đồ sự kiện, dashboard, danh sách… đều có dữ liệu phong phú để demo.

---

*Khi bạn duyệt kế hoạch này (chốt cơ chế = C# seeder, và scale), bước tiếp theo là hiện thực hóa
`DemoSeederService` + endpoint `/api/admin/dev/seed`, chạy theo pha §8.4.*
