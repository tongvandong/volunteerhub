# VolunteerHub Mobile (React Native + Expo)

App di động port từ `BaseCore.WebClient`, dùng chung backend (REST gateway + JWT + SignalR).
Xem kế hoạch đầy đủ: `../docs/9-mobile-react-native.md`.

## Trạng thái
**Pha 0 + 1 đã xong:** nền dự án (Expo Router, theme, api client, AuthContext) + đăng nhập + tab-bar
(Trang chủ với "Gợi ý cho bạn" từ knowledge graph + Hồ sơ + đăng xuất).

## Yêu cầu
- Backend đang chạy (Docker stack: `docker compose up -d` ở thư mục gốc).
- Node + Android Studio (emulator Android).

## Chạy (emulator Android)
```bash
cd BaseCore.MobileApp
npx expo start
# nhấn "a" để mở trên Android emulator (hoặc quét QR bằng Expo Go)
```
Đăng nhập demo: **demo.vol01 / demo123** (hoặc admin/admin123…).

## Cấu hình API
`src/api/client.js` → `API_BASE`:
- **Emulator Android:** `http://10.0.2.2/api` (mặc định — trỏ tới Caddy :80 trên máy host).
- **Điện thoại thật (cùng wifi):** đổi thành `http://<IP-LAN-máy>/api`.
- **VPS:** `https://<domain>/api`.

## Cấu trúc
```
src/
  api/client.js        # axios + JWT (AsyncStorage), các nhóm endpoint
  context/AuthContext  # login/logout, lưu user+token
  theme/index.js       # design tokens (port từ web)
  app/                 # Expo Router
    _layout.jsx        # AuthProvider + Stack
    index.jsx          # điều hướng theo trạng thái đăng nhập
    login.jsx
    (tabs)/_layout.jsx, index.jsx (Trang chủ), profile.jsx
```

## Build APK (Pha 9)

App đã cấu hình sẵn: tên **VolunteerHub**, package `com.volunteerhub.app`, quyền camera + vị trí.

### Cách 1 — EAS Build (đám mây, khuyên dùng, không cần Android SDK)
```bash
npm i -g eas-cli
eas login                 # đăng nhập tài khoản Expo (miễn phí)
eas build -p android --profile preview
```
→ Build trên máy chủ Expo, xong cho **link tải file .apk** cài thẳng vào điện thoại.

### Cách 2 — Build local (cần Android Studio/SDK + JDK 17)
```bash
npx expo prebuild -p android      # sinh thư mục android/ (gắn native module)
cd android
./gradlew assembleRelease         # Windows: gradlew.bat assembleRelease
# APK ở: android/app/build/outputs/apk/release/app-release.apk
```

> **Lưu ý cấu hình API khi build thật:** APK cài trên điện thoại thật **không dùng được `10.0.2.2`**.
> Trước khi build, sửa `ORIGIN` trong `src/api/client.js` sang **IP LAN máy chủ** (vd `http://192.168.1.x`)
> hoặc **VPS có HTTPS** (`https://domain`). Ngược lại app sẽ không gọi được backend.

### Icon / Splash
Đang dùng asset mặc định của template trong `assets/images/`. Thay file icon/splash ở đó rồi build lại để có thương hiệu riêng.

## Trạng thái: đã port ~99% chức năng web (xem ../docs/9)

**Volunteer:** Đăng ký tài khoản · Trang chủ (gợi ý graph) · Khám phá · Chi tiết (ca làm · gây quỹ · ủng hộ)
· Đăng ký (chọn ca) · Hoạt động (+ đánh giá sự kiện) · Điểm danh QR/GPS · Bản đồ · Thành tích (hộ chiếu ·
chứng chỉ PDF · huy hiệu) · Quyên góp của tôi · Sửa hồ sơ (avatar · kỹ năng · nộp KYC) · Phỏng vấn.

**Organizer:** Sự kiện của tôi · Tạo/Sửa/Huỷ/Hoàn thành sự kiện · Quản lý 5 tab (đăng ký · điểm danh
chấm công/checkout · ca làm · gây quỹ + xác nhận quyên góp + đề xuất tài trợ DN · gợi ý graph) ·
Hồ sơ tổ chức (nộp xác minh) · Thống kê hoạt động.

**Sponsor:** Tài trợ của tôi + Đề xuất (chấp nhận/từ chối) · Hồ sơ nhà tài trợ.

**Admin:** Tổng quan (inbox 4 loại) · Duyệt sự kiện/tổ chức/KYC/kỹ năng · Người dùng · Kiểm duyệt đánh giá ·
Giám sát tài chính · Danh mục (kỹ năng/lĩnh vực/huy hiệu) · Giám sát hệ thống · Xuất CSV (share).

**Chung:** Thông báo · Hồ sơ công khai · Kênh chat realtime (like · bình luận · poll) · Tra cứu chứng chỉ.

**Chưa làm:** gọi video TRTC thật (Pha 8B — cần dev build + TRTC creds; hiện có màn Phỏng vấn 8C).
