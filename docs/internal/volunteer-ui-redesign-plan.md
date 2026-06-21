# Kế hoạch redesign giao diện Volunteer

> Mục tiêu: thiết kế lại các trang dành cho role **Volunteer** — đẹp, hiện đại, dễ sử dụng không cần hướng dẫn.
> Quyết định đã chốt:
> - **Phương án:** Pilot 1 trang trước (Home/Trang chủ), dựa trên feedback rồi áp các trang khác.
> - **Phong cách:** Modern minimal (Linear/Notion-style).

---

## 1. Vấn đề hiện tại của UX volunteer

| Vấn đề | Biểu hiện |
|---|---|
| **Quá nhiều menu** | 9 mục sidebar — volunteer phải tự quyết định click vào đâu |
| **Trùng lặp dữ liệu** | Passport, MyBadges, MyCertificates đều xoay quanh "thành tích cá nhân" mà tách 3 trang |
| **Trông như admin panel** | Toàn card xám trắng + icon FontAwesome, không có hình ảnh/màu sắc cảm xúc |
| **Thiếu CTA "next action"** | Volunteer mở app không biết phải làm gì tiếp — không có gợi ý sự kiện theo kỹ năng/khu vực |
| **Form-heavy MyProfile** | Profile dạng form admin, không truyền cảm hứng cập nhật |
| **MyRegistrations rối** | Filter chips + card dày đặc thông tin + 3 nút nhỏ — khó scan trên mobile |

## 2. Nguyên tắc redesign

1. **Show, don't list** — ảnh sự kiện thật + ảnh avatar > danh sách text
2. **One screen, one job** — mỗi trang có 1 hành động chính rõ ràng
3. **Surface the next action** — luôn nói volunteer "việc tiếp theo của bạn là gì"
4. **Cảm xúc, không kỹ thuật** — đây là app làm việc tốt, không phải bảng điều khiển
5. **Mobile-first** — đa số volunteer Gen Z sẽ dùng điện thoại

## 3. Cấu trúc lại sidebar (9 → 5 mục)

| Trước | Sau |
|---|---|
| Tổng quan | **Trang chủ** (Home — feed sự kiện + việc cần làm) |
| Sự kiện công khai | gộp vào Trang chủ + tab "Khám phá" |
| Đăng ký của tôi | **Hoạt động của tôi** (gộp Đăng ký + Ủng hộ — có tab) |
| Ủng hộ của tôi | ⬆️ |
| Hồ sơ | **Hồ sơ** (gộp Profile + Passport — có tab "Thông tin" / "Hành trình") |
| Hộ chiếu | ⬆️ |
| Huy hiệu | **Thành tích** (gộp Badges + Certificates — có tab) |
| Chứng chỉ | ⬆️ |
| Thông báo | **Thông báo** (giữ, đưa lên topbar bell với badge số) |

→ **5 mục thay vì 9**. Mọi dữ liệu vẫn còn, chỉ tổ chức lại theo công việc của volunteer thay vì theo entity DB.

## 4. Hệ thống design mới (Modern Minimal / Linear-Notion-style)

### Design tokens

| Token | Giá trị |
|---|---|
| **BG nền** | `#FAFAFA` (thay vì `#f8fafc` hiện tại — bớt xanh) |
| **BG card** | `#FFFFFF` |
| **Border** | `1px solid rgba(15, 15, 15, 0.08)` — không shadow |
| **Hover** | `background: rgba(15, 15, 15, 0.03)` + `border-color: rgba(15,15,15,0.15)` |
| **Text primary** | `#0F0F0F` |
| **Text secondary** | `rgba(15,15,15,0.55)` |
| **Text tertiary** | `rgba(15,15,15,0.35)` |
| **Accent** | giữ `#1b61c9` nhưng dùng **rất tiết kiệm** — chỉ cho CTA chính + link |
| **Success** | `#15803d` (đã hoàn thành) |
| **Warning** | `#b45309` (việc cần làm) |
| **Radius** | `8px` cho card, `6px` cho input/button, `999px` cho pill |
| **Font sizes** | Display 28px / H2 16px / Body 14px / Caption 12px |
| **Spacing** | 4/8/12/16/24/32px scale |
| **Transition** | `150ms cubic-bezier(0.4, 0, 0.2, 1)` |

### So sánh với hiện tại

| Thuộc tính | Hiện tại | Đề xuất |
|---|---|---|
| Card | Bo 8px, shadow nhẹ | Bo 8px, border 1px, không shadow |
| Typography | 1 cỡ chữ chung | Display 28px / H2 16px / Body 14px / Caption 12px |
| Hình ảnh | Hiếm — chủ yếu icon | Ảnh sự kiện hero 16:9 ở mọi card sự kiện, avatar 64px ở profile |
| Empty state | Icon + 1 dòng text | Illustration SVG + headline + CTA mạnh |
| Skeleton loader | Có sẵn (`DashboardSkeleton`) | Tận dụng cho tất cả pages |

---

## 5. Kế hoạch chi tiết từng trang (full roadmap)

### 5.1 Trang chủ (Home) — pilot đợt 1
- **Hero**: lời chào theo giờ + tóm tắt 1 dòng ("Bạn đã có 12h tình nguyện trong tháng này")
- **"Việc của bạn"**: card sticky liệt kê actions theo độ cấp bách
  - Sự kiện sắp diễn ra → nút "Điểm danh QR" nếu đến giờ
  - Đăng ký chờ xác nhận
  - Yêu cầu KYC chưa hoàn tất
  - Sự kiện đã hoàn thành chưa đánh giá
- **Khám phá**: feed sự kiện được gợi ý (theo kỹ năng + khu vực) với ảnh lớn
- **Tác động của bạn**: mini-stat (giờ, sự kiện, huy hiệu) — link sang Thành tích

### 5.2 Hoạt động của tôi (Activity)
- 2 tab: **Đăng ký** | **Ủng hộ**
- Timeline view thay vì table — mỗi mục là 1 card có ảnh sự kiện
- Status pill có màu: chờ (vàng), đã xác nhận (xanh), đã tham gia (xanh đậm), đã hủy (xám)
- Mở rộng card → CTA chính (Điểm danh / Xin hủy / Đánh giá) — không phải 4 nút nhỏ chen chúc

### 5.3 Hồ sơ (Profile)
- 2 tab: **Thông tin** | **Hành trình**
- Tab Thông tin: avatar lớn + 4 section gập (Cá nhân, Liên hệ, Kỹ năng, KYC) — mặc định gập, click để mở
- Tab Hành trình (passport): hero card + timeline + skills + certificates rút gọn (link sang Thành tích)
- **Progress meter "Hoàn thiện hồ sơ"** ở trên — chỉ rõ phần còn thiếu → tăng độ phù hợp với sự kiện

### 5.4 Thành tích (Achievements)
- 2 tab: **Huy hiệu** | **Chứng chỉ**
- Huy hiệu: grid 3 cột, ảnh badge to (96px), locked = blur + lock icon nổi, click → modal kể câu chuyện "đạt được khi nào / điều kiện"
- Chứng chỉ: card kiểu "polaroid" với ảnh sự kiện + QR code preview của verify link → tạo cảm giác "vật phẩm"
- Nút **"Chia sẻ lên LinkedIn/Facebook"** ở mỗi cert/badge

### 5.5 EventDetail (đã có) — nâng cấp
- Ảnh hero cao 320px (đang 224)
- Sticky bottom-bar trên mobile với CTA "Đăng ký" / "Điểm danh"
- Khối "Tổ chức bởi" có avatar organizer + rating + nút chat
- Section "Volunteer khác đã đăng ký" (5 avatar đầu) — social proof

### 5.6 EventList (Khám phá)
- Filter bar gập trên mobile (chỉ hiện search + 1 nút "Lọc")
- Card sự kiện: ảnh 16:9 + tag kỹ năng matching màu xanh nếu phù hợp
- View toggle: **List** / **Map** (đã có MapView)
- Sort: phù hợp / gần nhất / sắp diễn ra

## 6. Components mới cần tạo

1. `EventCardLarge` — card sự kiện có ảnh hero (dùng ở Home + EventList)
2. `EventCardCompact` — card đề xuất ngang trên Home
3. `EmptyState` — wrapper chuẩn cho empty: illustration + headline + CTA
4. `ProgressMeter` — thanh hoàn thiện hồ sơ
5. `ActionRow` — 1 dòng việc cần làm (Home + Activity)
6. `SectionLabel` — label uppercase 11px (Linear-style)
7. `Tab` chuẩn (Profile/Activity/Achievements đều dùng)
8. `MobileActionBar` — sticky bottom bar cho mobile

## 7. Đề xuất sequencing (4 đợt PR riêng)

| Đợt | Phạm vi | Lý do tách |
|---|---|---|
| **0 (pilot)** | Home cho Volunteer + components `EventCardCompact`, `ActionRow`, `SectionLabel` + design tokens | Validate hướng tiếp cận trước |
| **1** | Components mới còn lại (`EventCardLarge`, `EmptyState`, `Tab`, `MobileActionBar`) + sidebar mới (9→5) | Foundation — đợt sau dùng lại |
| **2** | Activity (gộp Registrations + Donations) | Core daily-use surface |
| **3** | Profile + Achievements (gộp Passport/Profile, Badges/Certificates) | Identity + reward surface |
| **4** | EventList + EventDetail polish (hero, sticky CTA, social proof) | Discovery surface |

---

## 8. Pilot đợt 0 — Spec chi tiết Home

**File entry:** `src/pages/Dashboard.jsx` — tách role: nếu `user.role === 'Volunteer'` → render `VolunteerHome` mới, các role khác giữ flow cũ.

### 8.1 Layout (3 sections, max-width 880px center)

```
┌─────────────────────────────────────────────────────┐
│  Chào buổi sáng, Đông Tống                          │ ← H1 28px regular weight
│  Bạn có 2 việc cần làm hôm nay                      │ ← caption gray
├─────────────────────────────────────────────────────┤
│                                                     │
│  ◯ Hôm nay                                          │ ← Section label uppercase 11px
│  ┌─────────────────────────────────────────────┐   │
│  │ 09:00  Điểm danh tại "Dọn rác bãi biển"     │   │
│  │        Còn 30 phút · Bãi Sao, Phú Quốc      │   │
│  │                              [Điểm danh →]  │ ← inline-CTA
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ ⚠  Hoàn tất KYC để đăng ký sự kiện y tế    │   │
│  │                              [Bổ sung KYC] │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ◯ Sự kiện đề xuất                       [Xem tất] │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│ ← horizontal scroll
│  │   [ảnh hero] │ │   [ảnh hero] │ │   [ảnh hero] ││
│  │ Trồng cây ngập│ │ Hiến máu nhân │ │ Lớp học tiếng││
│  │ mặn Cần Giờ   │ │ đạo Q1        │ │ Anh trẻ em   ││
│  │ 25/06 · Q.7   │ │ 28/06 · Q.1   │ │ 30/06 · Q.3  ││
│  │ ✦ Phù hợp 80%│ │ ✦ Phù hợp 65%│ │ ✦ Phù hợp 50%││
│  └──────────────┘ └──────────────┘ └──────────────┘│
│                                                     │
│  ◯ Tác động của bạn                                │
│  ┌─────────────────────────────────────────────┐   │
│  │  12h    ·    3 sự kiện    ·    2 huy hiệu  │   │ ← inline stat row
│  │  Tháng này                                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 8.2 Section 1: Greeting
- `Chào buổi sáng/chiều/tối, {tên}` — auto theo `new Date().getHours()`
  - 5–11h: sáng / 11–18h: chiều / 18–24h: tối / 0–5h: tối
- Sub-line: số việc cần làm (nếu = 0 thì "Chúc bạn một ngày tốt lành")
- **Không có ảnh / gradient / icon** — chỉ text, đúng style Linear

### 8.3 Section 2: "Hôm nay"
Hiển thị tối đa 5 ActionRow theo priority:

| Priority | Trigger | Label | CTA | Màu accent |
|---|---|---|---|---|
| 1 | Có registration `Confirmed && !isAttended` cho event đang/sắp diễn ra (±2h) | "Điểm danh tại `{event.title}`" | "Điểm danh →" | Warning amber |
| 2 | KYC `!Verified` mà có event đăng ký require KYC | "Bổ sung KYC" | "Mở hồ sơ" | Warning amber |
| 3 | Event đã `Completed` mà chưa rating | "Đánh giá `{event.title}`" | "Đánh giá" | Neutral |
| 4 | Donation `PendingConfirmation` > 7 ngày | "Theo dõi ủng hộ" | "Xem" | Neutral |
| 5 | Hồ sơ thiếu (avatar/skills/bio) — tối đa 1 lần / session | "Hoàn thiện hồ sơ — tăng cơ hội phù hợp" | "Cập nhật" | Neutral |

Empty state: card nhẹ `"Bạn không có việc gì gấp. Khám phá sự kiện mới bên dưới."`

### 8.4 Section 3: "Sự kiện đề xuất"
- Horizontal scroll snap, ẩn scrollbar (CSS `scrollbar-width: none`)
- Mỗi card: ảnh 16:9 rounded-8 (nếu không có ảnh → gradient placeholder neutral), title 2 dòng max, meta line 1 (ngày + địa điểm), pill matching skill % (nếu volunteer có skills)
- Hover: scale 1.01 + border đậm hơn
- Click → `/events/:id`
- Logic match: lấy event `status='Approved'`, `startDate > now`, `currentParticipants < maxParticipants`, sort theo `matchSkillCount DESC, startDate ASC`, limit 8
- Right-most card: "Xem tất cả →" thay vì content (link `/events`)

### 8.5 Section 4: "Tác động của bạn"
- Một dòng inline: `12h · 3 sự kiện · 2 huy hiệu` — separator là `·` màu tertiary
- Sub-line: "Tháng này" + link nhỏ "Xem hành trình →" (→ `/profile?tab=passport`)
- Không dùng StatCard box — quá nặng cho Linear-style

### 8.6 API/Data cần

| Data | Endpoint hiện có | Ghi chú |
|---|---|---|
| User profile + skills | `profileApi.getMyProfile()` | đã có |
| My registrations | `registrationApi.getMyRegistrations()` | đã có |
| My donations | `supportCampaignApi.getMyDonations()` | đã có |
| Recommended events | **CẦN MỚI** hoặc `eventApi.getAll({ status: 'Approved' })` rồi filter/sort client-side | đề xuất làm client-side cho pilot — sau mới làm backend |
| Stats tháng này | `profileApi.getPassport()` returns `totalHours/totalEvents` | tổng cộng — pilot tạm dùng tổng, sau làm tháng |

→ Pilot có thể dùng **toàn bộ data hiện có** + xử lý client. Không cần đổi backend ở đợt 0.

### 8.7 Files thay đổi cho pilot

| File | Action |
|---|---|
| `src/pages/Dashboard.jsx` | Tách: nếu role=Volunteer → render `VolunteerHome` mới, các role khác giữ nguyên flow cũ |
| `src/pages/volunteer/Home.jsx` | **MỚI** — component chính |
| `src/components/ui/EventCardCompact.jsx` | **MỚI** — card đề xuất ngang |
| `src/components/ui/ActionRow.jsx` | **MỚI** — 1 dòng việc cần làm |
| `src/components/ui/SectionLabel.jsx` | **MỚI** — label uppercase 11px (dùng lại sau) |
| `src/index.css` hoặc `tailwind.config.js` | Thêm tokens `text-ink-*`, `bg-canvas`, `border-soft` |

### 8.8 Acceptance criteria

- [ ] Tải Home < 500ms với data đã cache
- [ ] Mobile (< 640px): sections stack, horizontal scroll mượt
- [ ] Empty state hợp lý cho user mới chưa đăng ký gì
- [ ] Không thêm dependency mới
- [ ] Build clean, không regression role khác
- [ ] Greeting đổi theo giờ trong ngày
- [ ] ActionRow ưu tiên đúng theo bảng priority
- [ ] Click EventCardCompact điều hướng đúng `/events/:id`

---

## 9. Trạng thái

- **2026-05-25** — plan được duyệt: pilot Home + phong cách Linear-style.
- **2026-05-26** — Đợt 0 hoàn thành. Build clean (224 modules, 0 lỗi).
- **Đợt 0 (pilot Home):** ✅ **DONE**
  - `src/pages/Dashboard.jsx` — tách role Volunteer → `<VolunteerHome />` ✅
  - `src/pages/volunteer/Home.jsx` — 3 sections (Greeting / Hôm nay / Đề xuất / Tác động) ✅
  - `src/components/ui/EventCardCompact.jsx` — card ngang 16:9 + match% pill ✅
  - `src/components/ui/ActionRow.jsx` — P1–P5 với accent warning/neutral ✅
  - `src/components/ui/SectionLabel.jsx` — uppercase 11px Linear-style ✅
  - Design tokens (`ink`, `canvas`) — đã có trong `tailwind.config.js` ✅
  - CSS utilities (`no-scrollbar`, `card-soft`, `link-inline`) — đã có trong `index.css` ✅
- **2026-05-26** — Đợt 1 hoàn thành. Build clean (224 modules, 0 lỗi).
- **Đợt 1 (Foundation):** ✅ **DONE**
  - `MainLayout.jsx` — Volunteer sidebar 6→5 mục (Thông báo chuyển lên topbar bell) ✅
  - `MainLayout.jsx` — Topbar bell có badge đỏ hiện số thông báo chưa đọc, tự refetch khi navigate ✅
  - `EmptyState.jsx` — Redesign: icon container rounded-2xl, ink color system, CTA btn-primary ✅
  - `EventCardLarge.jsx` — Polish: gradient placeholder đẹp, ink-style pills, progress bar gradient ✅
  - `Tabs.jsx`, `MobileActionBar.jsx` — giữ nguyên (đã chuẩn) ✅
- **2026-05-26** — Đợt 2 hoàn thành. Build clean (224 modules, 0 lỗi).
- **Đợt 2 (Activity):** ✅ **DONE**
  - Timeline view với monthly grouping (grouped by event.startDate desc) ✅
  - Custom status pills (ink color system): chờ vàng / xác nhận xanh / tham gia emerald / hủy xám ✅
  - `RegistrationCard`: thumbnail 72×72, status pill, meta info, single primary CTA strip ✅
  - CTA priority: Điểm danh QR > Đánh giá > Xin hủy > Rút đăng ký ✅
  - `FilterChips` reusable component với ink-style active state ✅
  - `DonationCard`: amount prominent + vertical divider + status pill + cancel action ✅
  - Donations stat strip: confirmed · pending · count (ink style) ✅
- **2026-05-26** — Đợt 3 hoàn thành. Build clean (224 modules, 0 lỗi).
- **Đợt 3 (Profile + Achievements):** ✅ **DONE**
  - `MyBadges.jsx` — Grid 3/4/5 cols, 88px cells, blur+grayscale+lock overlay, click modal với share LinkedIn/Facebook ✅
  - `MyCertificates.jsx` — Polaroid style: 4:3 event image overlay với hours badge, caption strip, code copy, LinkedIn/Facebook share, PDF+verify link ✅
  - `MyProfile.jsx` — Mini profile header, completion meter (7 mục, gradient bar), 4 accordion sections (Cá nhân/Bio/Kỹ năng/KYC), ink color system xuyên suốt ✅
  - `Passport.jsx` — Clean white hero (4px accent bar thay gradient), ink stats row, skills chips, certificates max 3 + link xem thêm, timeline cleaner dots ✅
- **2026-05-26** — Đợt 4 hoàn thành. Build clean (223 modules, 0 lỗi).
- **Đợt 4 (EventList + EventDetail):** ✅ **DONE**
  - `EventDetail.jsx` — Ink-style status banners (amber/red/gray rgba), ink hero placeholder, back link in ink, social proof sidebar (stacked avatar circles + participant count + 3px gradient bar), organizer block (conditional on `event.organizer`), polished registration card ✅
  - `EventList.jsx` — Switched `EventCard` → `EventCardLarge` toàn bộ (grid, radius, recommended), mobile-collapsible filter bar (search luôn hiển thị, nút "Lọc" toggle expandable panel với skill/status/geo/radius/xóa lọc), filter badge count ✅
