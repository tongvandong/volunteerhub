# 9. Kế hoạch port toàn bộ web sang React Native

> Mục tiêu: dựng app **React Native (Expo)** port **toàn bộ** chức năng của `BaseCore.WebClient`,
> dùng lại 100% backend (REST qua gateway + JWT + SignalR). Làm **dần theo pha**.
>
> ⚠️ Lưu ý cốt lõi: RN **không tái dùng JSX/CSS** — mỗi màn phải **dựng lại UI** bằng component RN.
> Cái tái dùng được là **tầng API + logic nghiệp vụ + luồng auth**.

---

## 9.1. Phạm vi
Port lại ~**46 màn** across 4 vai trò (Volunteer / Organizer / Sponsor / Admin) + public + realtime chat +
gọi video phỏng vấn. Danh sách đầy đủ ở §9.6.

## 9.2. Quyết định kỹ thuật

| Chủ đề | Chọn | Lý do |
|---|---|---|
| Framework | **Expo** (kèm **Development Build**, không chỉ Expo Go) | Chuẩn ngành 2026; nhưng có **WebRTC + barcode** cần native module → phải dùng **dev build / prebuild**, không chạy được trên Expo Go thuần |
| Điều hướng | **Expo Router** (file-based) | Giống Next/React Router, hợp port |
| Ngôn ngữ | TypeScript (khuyến nghị) hoặc JS | Web đang JS → có thể JS cho nhanh |
| State/Auth | Context + AsyncStorage | Bê thẳng `AuthContext` từ web |
| HTTP | **axios** | Bê gần nguyên `services/api.js` |
| Build/Phát hành | **EAS Build** (cloud) hoặc local Gradle | Ra APK/AAB |

> **Quan trọng về Expo Go:** Expo Go (app quét QR) **không chạy** `react-native-webrtc`. Khi tới phần
> gọi video, phải tạo **Development Build** (`npx expo prebuild` + build native) hoặc EAS. Các pha đầu
> (login, list, form…) vẫn chạy ngon trên Expo Go để dev nhanh.

## 9.3. Vị trí & cấu trúc dự án
Tạo `BaseCore.MobileApp/` (Expo) ngang hàng trong repo:
```
BaseCore.MobileApp/
  app/                    # Expo Router (màn hình theo route)
    (auth)/login.tsx, register.tsx
    (tabs)/index.tsx ...  # tab theo vai trò
    events/[id].tsx ...
  src/
    api/                  # ← bê từ web services/api.js (đổi localStorage→AsyncStorage)
    context/AuthContext   # ← bê từ web
    theme/                # ← port design tokens (màu ấm) sang object RN
    components/           # component RN tái dùng (Card, Button, EventCard…)
    hooks/, utils/        # ← bê logic (checkin window, format…)
  app.json, eas.json
```

## 9.4. Tái dùng vs viết lại
| Tầng | Tái dùng từ web? |
|---|---|
| `services/api.js` (mọi endpoint) | ✅ ~nguyên (đổi `localStorage`→`AsyncStorage`, baseURL theo env) |
| `AuthContext`, refresh token | ✅ gần nguyên |
| Logic: tính match, format ngày, checkin window, validation | ✅ |
| Design tokens (bảng màu ấm) | ⚠️ chuyển sang object theme RN (giá trị màu giữ nguyên) |
| **JSX + Tailwind + layout** | ❌ viết lại bằng `<View>/<Text>/StyleSheet` |
| Leaflet map, Channel chat UI, video call | ❌ viết lại bằng lib native |

## 9.5. Thư viện (mapping tính năng)
| Nhu cầu | Thư viện RN | Thay cho (web) |
|---|---|---|
| Điều hướng | `expo-router` | React Router |
| Lưu token | `@react-native-async-storage/async-storage` | localStorage |
| HTTP | `axios` | axios (giữ nguyên) |
| Bản đồ + marker | `react-native-maps` | Leaflet |
| Vị trí (check-in radius) | `expo-location` | browser geolocation |
| **QR check-in** | `expo-camera` (barcode) | jsQR/web camera |
| Chọn/chụp ảnh upload | `expo-image-picker` | input file |
| Realtime chat | `@microsoft/signalr` | (giữ client, dựng lại UI) |
| **Gọi video** | `react-native-webrtc` (+ signaling hiện có) | WebRTC web |
| Thông báo đẩy | `expo-notifications` | — (mới) |
| Biểu đồ (insights/dashboard) | `react-native-gifted-charts` / `victory-native` | recharts/chart web |
| Xem PDF chứng chỉ | `expo-web-browser` (mở link) hoặc `react-native-pdf` | <iframe>/link |
| Tải/chia sẻ file export | `expo-file-system` + `expo-sharing` | blob download |
| Form | `react-hook-form` | react-hook-form |

## 9.6. Bản đồ màn hình web → RN (độ khó: 🟢 dễ / 🟡 vừa / 🔴 khó)

### Public / Auth
| Web | Độ khó | Ghi chú |
|---|---|---|
| Login, Register | 🟢 | form + auth (bê logic) |
| LandingPage | 🟢 | tĩnh |
| EventList | 🟡 | list + filter + (map view) |
| EventDetail | 🟡 | chi tiết + đăng ký + map nhỏ |
| VerifyCertificate | 🟢 | nhập mã → kết quả |

### Volunteer
| Web | Độ khó | Ghi chú |
|---|---|---|
| Home (+ "Gợi ý cho bạn" graph) | 🟡 | thẻ thống kê + gọi `/recommendations/events` |
| Activity | 🟡 | timeline hoạt động |
| MyRegistrations | 🟡 | danh sách + hủy + đánh giá |
| MyProfile / Profile | 🟡 | avatar upload, kỹ năng |
| Passport | 🟡 | tổng hợp hành trình |
| Achievements / MyBadges / MyCertificates / MyDonations | 🟢🟡 | list; chứng chỉ mở PDF |

### Organizer
| Web | Độ khó | Ghi chú |
|---|---|---|
| MyEvents | 🟡 | list sự kiện của mình |
| EventForm (tạo/sửa) | 🔴 | form lớn + **chọn vị trí trên map** + upload ảnh |
| ManageEvent (index + 6 tab: Registrations, CheckIn, Shifts, Campaigns, Corporate, Report) | 🔴 | composite lớn; **CheckIn = quét QR** |
| OrganizerVerification | 🟡 | upload tài liệu + logo |
| OrganizerInsights | 🔴 | **biểu đồ** |

### Sponsor
| Web | Độ khó | Ghi chú |
|---|---|---|
| SponsorProfile | 🟡 | form hồ sơ |
| MySponsorships | 🟡 | danh sách + đề xuất tài trợ |

### Admin (nhiều bảng quản trị)
| Web | Độ khó | Ghi chú |
|---|---|---|
| Dashboard | 🟡 | thống kê + inbox |
| AdminEvents / AdminUsers / AdminRatings / AdminFinanceWatch / AdminBadges / AdminCategories / AdminSkills | 🟡 | bảng + thao tác duyệt; mobile dùng dạng card/list |
| AdminOrganizerVerifications / AdminVolunteerVerifications / AdminVerifications | 🟡 | duyệt hồ sơ |
| AdminExport | 🔴 | **tải file** (CSV/Excel) → share sheet |
| AdminMonitoring | 🟡 | trạng thái hệ thống |

### Shared / Realtime
| Web | Độ khó | Ghi chú |
|---|---|---|
| Notifications | 🟢 | list + realtime badge |
| PublicProfile | 🟢 | xem hồ sơ công khai |
| **Channel (chat realtime)** | 🔴 | **SignalR** + UI chat (tin nhắn, mention, poll) dựng lại |
| **InterviewCallModal (gọi video)** | 🔴🔴 | **WebRTC** — phần khó nhất (xem §9.7) |
| MapView | 🔴 | `react-native-maps` |
| VolunteerCheckInModal | 🔴 | **camera QR** + định vị |

## 9.7. ⚠️ Phần khó & cảnh báo

1. **Gọi video phỏng vấn (InterviewCallModal) — khó nhất.**
   - Web dùng WebRTC trình duyệt. RN phải dùng `react-native-webrtc` → **bắt buộc Development Build** (không chạy Expo Go), cần quyền camera/mic, và **viết lại tầng signaling** cho khớp (hiện đi qua SignalR?).
   - **Đề xuất:** v1 **hoãn** — tạm mở bằng WebView/trình duyệt; làm native WebRTC ở pha cuối khi mọi thứ khác xong.

2. **Chat realtime (Channel).** `@microsoft/signalr` chạy trên RN, nhưng phải **dựng lại UI chat** + xử lý **reconnect khi app nền/đổi mạng** (mobile hay mất kết nối) + token qua query `access_token` (đã có ở backend).

3. **Bản đồ.** Leaflet → `react-native-maps`: API khác hẳn (marker, cluster, chọn toạ độ trong EventForm). Cần Google Maps API key cho Android.

4. **Quét QR + định vị (check-in).** `expo-camera` + `expo-location`: thực ra **native làm mượt hơn web**, nhưng cần quyền runtime.

5. **Biểu đồ (Insights/Dashboard).** recharts không dùng được → `victory-native`/`gifted-charts`, vẽ lại.

6. **Upload ảnh / tải file export.** `expo-image-picker` (upload), `expo-file-system`+`expo-sharing` (tải CSV/Excel → share sheet, vì mobile không "download" như web).

7. **Xem PDF chứng chỉ.** Mở bằng `expo-web-browser` (link tới PDF do worker Rust sinh) cho gọn, hoặc `react-native-pdf`.

8. **Kết nối backend.** Không có `localhost`. Cấu hình `API_BASE_URL` theo profile build: emulator `10.0.2.2`, điện thoại thật LAN IP, hoặc **VPS HTTPS**. (chi tiết `docs/6`).

## 9.8. Lộ trình theo pha (làm dần)

| Pha | Nội dung | Kết quả | Độ lớn |
|---|---|---|---|
| **0. Nền** | Tạo Expo app, Expo Router, theme (tokens), bê `api/` + `AuthContext`, cấu hình env API | App chạy, gọi API được | 🟢 ~1 ngày |
| **1. Auth + shell** | Login/Register, lưu JWT, tab-bar theo vai trò, splash | Đăng nhập 4 vai trò | 🟢 ~1 ngày |
| **2. Volunteer core** | Home (+gợi ý graph), EventList, EventDetail+đăng ký, MyRegistrations, Profile, Passport, Achievements | Luồng tình nguyện viên đầy đủ | 🟡 ~4–6 ngày |
| **3. QR + Map** | VolunteerCheckInModal (camera), MapView, chọn vị trí | Check-in QR native | 🔴 ~3 ngày |
| **4. Organizer** | MyEvents, EventForm, ManageEvent (6 tab), Verification, Insights(charts) | Luồng organizer | 🔴 ~1 tuần |
| **5. Sponsor + Notifications + PublicProfile** | SponsorProfile, MySponsorships, Notifications, PublicProfile | | 🟡 ~3 ngày |
| **6. Admin** | Dashboard + ~12 màn quản trị (dạng card/list) | Luồng admin | 🟡 ~1 tuần |
| **7. Chat realtime** | Channel (SignalR + UI chat) | Realtime trên mobile | 🔴 ~4 ngày |
| **8. Gọi video (WebRTC)** | InterviewCallModal native (dev build) | Phỏng vấn video | 🔴🔴 ~1 tuần |
| **9. Hoàn thiện + build** | Push notification, icon/splash, EAS build APK/AAB, test thiết bị thật | APK demo/phát hành | 🟡 ~3 ngày |

**Ưu tiên cho demo nhanh:** Pha 0→3 (auth + toàn bộ luồng volunteer + QR) đã đủ một demo mobile rất thuyết phục. Organizer/admin/chat/video làm tiếp sau.

## 9.9. Ước lượng tổng & rủi ro
- **Tổng để "port hết"**: thực tế **~5–8 tuần** làm việc đều (đây là viết lại UI cả app).
- **Demo tốt (pha 0–3)**: **~1.5–2 tuần**.
- **Rủi ro lớn nhất:** WebRTC (pha 8) — nên hoãn/đơn giản hoá. Map cần API key. Reconnect SignalR trên mobile.
- **Mẹo giảm tải:** màn admin (bảng) trên mobile nên rút gọn thành list/card thay vì port nguyên bảng rộng.

## 9.10. Công cụ cần cài
- **Node** (đã có), **Android Studio** (SDK + emulator), **JDK 17**.
- `npm i -g eas-cli` (build cloud) — tùy chọn.
- Tài khoản Expo (miễn phí) nếu dùng EAS.
- **Google Maps Android API key** (cho `react-native-maps`).

---

*Khi bạn duyệt, bước đầu là **Pha 0**: tôi scaffold `BaseCore.MobileApp/` (Expo + Router + theme + api + AuthContext + cấu hình API URL), rồi **Pha 1** (Login + tab-bar) để bạn chạy thử trên Expo Go ngay.*
