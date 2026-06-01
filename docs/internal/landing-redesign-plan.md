# Kế hoạch redesign Landing Page

> Mục tiêu: thiết kế lại `/` (LandingPage) đồng bộ với phong cách Linear/Notion-minimal đã áp dụng cho phần app volunteer.
>
> Quyết định đã chốt:
> - **Stats**: bỏ hẳn khỏi hero (không dùng số giả). Hero gọn hơn.
> - **Screenshot**: dùng screenshot UI thật của volunteer Home (sẽ chụp sau khi user test xong redesign volunteer). Tạm dùng placeholder.
> - **Visual**: tiếp tục Linear/Notion-minimal style.

---

## 1. Vấn đề Landing hiện tại

| # | Vấn đề | Biểu hiện |
|---|---|---|
| 1 | Tone mismatch với app | Hero rất "marketing" (text-shadow, font-extrabold, gradients dày); app đã Linear-style minimal |
| 2 | Stats giả | `featuredEvents.length + '+'` — chỉ đếm 6 item của trang đầu, không phải số thật |
| 3 | 4 Role cards trùng action | 3/4 cards link `/login`. Visitor chưa biết tại sao chọn role nào |
| 4 | Hero không trả lời "đây là gì cho TÔI" | Headline `VolunteerHub` + paragraph generic |
| 5 | Không có product evidence | Không screenshot, không số liệu thật, không logo đối tác |
| 6 | 2 CTA ngang hàng trong hero | "Khám phá sự kiện" vs "Đăng ký ngay" — phân tán focus |
| 7 | Mobile: hero `min-h-screen` | Người dùng phải scroll mới thấy content tiếp theo |
| 8 | Featured event card style khác `EventCardLarge` mới | Không tận dụng component pool đã có |
| 9 | CTA cuối gradient xanh đậm | Tone không khớp Linear-style mới |

## 2. Nguyên tắc redesign

1. **Product-first, không marketing-first** — Cho thấy app làm gì, không hùng biện
2. **Một CTA chính** trong hero — Giảm noise
3. **Không số giả** — Bỏ stats khỏi hero; nếu sau này có endpoint thật mới đưa vào section riêng
4. **Mobile-compact** — Hero ~ 60vh, không full-screen
5. **Linear visual tokens** — `card-soft`, ink palette, không gradient nặng

## 3. Cấu trúc mới (6 section)

```
┌──────────────────────────────────────────────────────────┐
│  HERO (~ 60vh)                                           │
│  Left: Headline 1 dòng + sub-line + 1 primary CTA        │
│  Right: Screenshot UI Home volunteer (placeholder ban đầu)│
├──────────────────────────────────────────────────────────┤
│  VALUE PROPS (3 cột)                                     │
│  - Tìm sự kiện theo kỹ năng                              │
│  - Điểm danh QR/GPS minh bạch                            │
│  - Chứng chỉ + huy hiệu sau sự kiện                      │
├──────────────────────────────────────────────────────────┤
│  ROLE PATHS (tabs ngang)                                 │
│  Tab "Tình nguyện viên" / "Ban tổ chức" / "Nhà tài trợ" │
│  Mỗi tab: 3 bullet ngắn + screenshot UI tương ứng + CTA  │
├──────────────────────────────────────────────────────────┤
│  FEATURED EVENTS                                         │
│  Dùng EventCardLarge component đã có, grid 3 cột         │
├──────────────────────────────────────────────────────────┤
│  HOW IT WORKS (3 step ngang, line connectors)            │
│  01 Khám phá → 02 Đăng ký → 03 Tham gia & nhận chứng chỉ│
├──────────────────────────────────────────────────────────┤
│  CTA FOOTER (subtle, no gradient)                        │
│  "Sẵn sàng bắt đầu?" + 1 CTA "Đăng ký miễn phí"          │
└──────────────────────────────────────────────────────────┘
```

## 4. Spec chi tiết từng section

### 4.1 Hero

- **Layout**: 2 cột desktop (`lg:grid-cols-[1.1fr_1fr]`), 1 cột mobile (stack)
- **Left column**:
  - Eyebrow chip nhỏ: `Nền tảng tình nguyện` (border-soft, không gradient)
  - H1: `Kết nối tình nguyện với cộng đồng` — `text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900`
  - Paragraph: `Tìm sự kiện phù hợp với kỹ năng, đăng ký nhanh, điểm danh QR/GPS, nhận chứng chỉ chính thức sau mỗi chương trình.` — `text-lg text-gray-600 leading-relaxed`
  - 1 primary CTA: `Khám phá sự kiện →` (→ `/events`)
  - 1 text-link secondary: `Cách hoạt động ↓` (smooth scroll xuống "How it works")
- **Right column**:
  - Screenshot UI volunteer Home (file `public/landing/hero-home.png` — placeholder ban đầu, thay sau khi chụp)
  - Khung mockup: bo 16px, border `ink-8`, không shadow nặng
  - Mobile: ảnh hiển thị ở dưới headline, height giới hạn 240px
- **Bỏ stats** (theo quyết định người dùng)
- **Bỏ overlay đen** + text-shadow
- **Background**: `bg-canvas` (FAFAFA), không ảnh full-screen

### 4.2 Value Props

- **Section label**: `Tại sao VolunteerHub`
- **Headline**: `Trải nghiệm tình nguyện rõ ràng từ đầu tới cuối`
- **Grid**: 3 cột (md), 1 cột (mobile)
- **Mỗi item** (không dùng card có background đậm):
  - Icon nhỏ (16px) inline ink-60
  - Tiêu đề bold 16px
  - Paragraph 14px ink-60
- **3 items**:
  1. **Phù hợp với kỹ năng** — Gợi ý sự kiện theo kỹ năng và khu vực, đo mức độ phù hợp theo %
  2. **Minh bạch giờ tình nguyện** — Điểm danh QR/GPS, ban tổ chức xác nhận giờ, không thể giả mạo
  3. **Ghi nhận có giá trị** — Huy hiệu, chứng chỉ tải PDF, link verify công khai

### 4.3 Role Paths (tabs)

- **Section label**: `Cho mọi vai trò`
- **Headline**: `Một nền tảng, ba hành trình`
- **Tabs** (dùng component `Tabs` đã có ở Đợt 1): `Tình nguyện viên` / `Ban tổ chức` / `Nhà tài trợ`
- **Mỗi tab content** (split 2 cột):
  - Left: 3 bullet ngắn (icon check) + 1 CTA `Đăng ký với vai trò này →`
  - Right: screenshot UI role tương ứng (placeholder)
- **Lý do không dùng 4 card riêng**:
  - Admin không cần landing → bỏ
  - Tab tránh "wall of cards"
  - Visitor focus 1 role tại 1 lúc

### 4.4 Featured Events

- **Section label**: `Đang diễn ra`
- **Headline**: `Sự kiện mới nhất từ cộng đồng`
- **Link**: `Xem tất cả sự kiện →` (góc phải)
- **Grid**: dùng `EventCardLarge` 3 cột desktop / 1 cột mobile
- **Source**: `eventApi.getAll({ status: 'Approved', pageSize: 6 })`
- **Empty state**: dùng `EmptyState` component đã có

### 4.5 How It Works

- **Section label**: `Quy trình`
- **Headline**: `3 bước để bắt đầu`
- **Steps timeline** (3 step ngang desktop, dọc mobile):
  - 01 — Khám phá: Lọc theo kỹ năng, thời gian, địa điểm
  - 02 — Đăng ký: Chọn ca, gửi đăng ký, chờ xác nhận
  - 03 — Tham gia & ghi nhận: Điểm danh QR/GPS, nhận giờ + chứng chỉ
- **Visual**:
  - Mỗi step: number lớn `01` text-3xl ink-15 + title + description
  - Connector line giữa các step (`hidden md:block`) — 1px ink-15
  - Không dùng box card xanh emerald như cũ

### 4.6 CTA Footer

- **Layout**: rounded-lg `card-soft` (border-soft, không gradient)
- **Headline**: `Sẵn sàng bắt đầu hành trình tình nguyện?`
- **Sub-line**: `Đăng ký miễn phí — chỉ mất 30 giây`
- **1 CTA primary**: `Tạo tài khoản miễn phí →` (`/register`)
- **Hiển thị**: chỉ khi `!isAuthenticated` (đã login thì hide hoặc hiện CTA "Vào dashboard")

## 5. Visual changes cụ thể

| Element | Trước | Sau |
|---|---|---|
| Hero background | Image full-screen + dark overlay | `bg-canvas` (#FAFAFA), 2 cột với ảnh UI bên phải |
| Headline | `text-5xl lg:text-6xl font-extrabold` text trắng | `text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900` |
| Stats | 4 box `bg-slate-950/36 backdrop-blur` | **Bỏ hẳn** |
| Role cards | 4 cards, 4 màu khác nhau | Tabs ngang, 1 màu, switch để xem |
| Steps section | 3 cards background emerald | Timeline số to + connector line, ink-only |
| CTA cuối | Gradient blue-indigo + text trắng | Card trắng `card-soft`, headline đen, 1 CTA primary |
| Color palette | blue + emerald + purple + amber + red | Ink + primary blue accent only |
| Mobile hero | `min-h-screen` full-screen | Auto-height stack, ảnh nhỏ dưới headline |

## 6. Components tận dụng từ redesign Volunteer

- `Tabs` — Role Paths section
- `EventCardLarge` — Featured Events
- `SectionLabel` — Mọi section header
- `card-soft` utility — Thay card cũ
- `link-inline` — Secondary text links
- Ink palette + canvas BG — Linear-style tokens
- `EmptyState` — Featured Events empty state

## 7. Components mới (tùy chọn, không bắt buộc)

- `MockupFrame.jsx` — Wrapper cho ảnh UI có khung "device" giả (border + shadow nhẹ). Có thể skip, dùng plain `<img>` trong rounded border.

## 8. Assets

| Asset | Path | Trạng thái |
|---|---|---|
| Screenshot UI Home volunteer | `public/landing/hero-home.png` | **PLACEHOLDER** — chụp sau khi user test redesign volunteer |
| Screenshot UI EventDetail | `public/landing/role-volunteer.png` | PLACEHOLDER |
| Screenshot UI ManageEvent | `public/landing/role-organizer.png` | PLACEHOLDER |
| Screenshot UI MySponsorships | `public/landing/role-sponsor.png` | PLACEHOLDER |
| Logo favicon | `public/favicon.svg` | ✓ Đã có |

→ Placeholder ban đầu sẽ là 1 SVG đơn giản (xám có icon ở giữa) để layout không vỡ; thay file PNG sau.

## 9. Files thay đổi

| File | Action |
|---|---|
| `src/pages/public/LandingPage.jsx` | **REWRITE** — 6 section mới |
| `public/landing/*.png` | **MỚI** — placeholder SVG, replace bằng PNG sau |
| `src/components/layouts/PublicLayout.jsx` | Polish nhẹ — không bắt buộc, có thể skip nếu đã ổn |

## 10. Acceptance criteria

- [ ] Build clean, không regression
- [ ] Mobile (< 640px): hero stack ngay, ảnh không che CTA
- [ ] Desktop: hero 2 cột, screenshot align với headline
- [ ] Role tabs switch mượt, mỗi tab có CTA riêng
- [ ] Featured events dùng `EventCardLarge`, 3 cột desktop
- [ ] Không còn `text-shadow`, `font-extrabold`, gradient nặng
- [ ] CTA cuối không gradient — đồng tone với app

## 11. Sequencing

| Đợt | Phạm vi | Phụ thuộc |
|---|---|---|
| **A** | Tạo placeholder SVG cho `public/landing/*.png` (4 file) | Không |
| **B** | Rewrite `LandingPage.jsx` 6 section (dùng placeholder) | A |
| **C** | Chụp screenshot UI thật → thay 4 file PNG | Sau khi user test redesign volunteer |
| **D** | Polish `PublicLayout` (optional) | Không bắt buộc |

**Đề xuất PR**: gộp A + B + (D nếu cần) thành 1 PR. C là asset commit riêng sau.

---

## 12. Trạng thái

- **2026-05-26** — plan được duyệt với các lựa chọn: bỏ stats khỏi hero, dùng screenshot sau, Linear-style.
- **Đợt A + B**: chưa bắt đầu code.
- **Đợt C**: chờ user test redesign volunteer và chụp UI.
