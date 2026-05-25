# VolunteerHub - Giao diện Stitch (React + Tailwind)

Giao diện frontend mới cho hệ thống VolunteerHub, được chuyển đổi từ các template HTML trong `frontend-stitch` sang React với Tailwind CSS. Hoàn toàn bằng tiếng Việt có dấu.

## 🚀 Khởi chạy

```bash
cd frontend-stitch-react
npm install
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5174`

## 📁 Cấu trúc thư mục

```
src/
├── components/
│   ├── common/          # Icon, Loading
│   ├── layouts/         # Sidebar, TopNav, MainLayout
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx  # Quản lý xác thực
├── pages/
│   ├── auth/            # Đăng nhập, Đăng ký
│   ├── volunteer/       # Dashboard, Tìm sự kiện, Đăng ký, Hồ sơ, Passport
│   ├── organizer/       # Dashboard, Quản lý sự kiện, Điểm danh, Xác minh
│   ├── admin/           # Dashboard, Người dùng, Xác minh, Tài chính, Hệ thống
│   ├── sponsor/         # Dashboard, Tài trợ & Quyên góp, Hồ sơ
│   └── shared/          # Chi tiết sự kiện, Kênh giao tiếp, Thông báo
├── services/
│   └── api.js           # Tất cả API endpoints
├── utils/
│   └── navigation.js    # Routing helpers
├── App.jsx              # Router chính
├── main.jsx             # Entry point
└── index.css            # Tailwind + custom styles
```

## 🎨 Theme

- **Màu chủ đạo**: Teal (#0d9488)
- **Font**: Plus Jakarta Sans (headlines), Inter (labels)
- **Border radius**: Bo tròn lớn (2xl, 3xl)
- **Shadows**: Mềm mại, nhẹ nhàng

## 🔗 Tích hợp Backend

- Sử dụng cùng API endpoints với `BaseCore.WebClient`
- Proxy `/api` → `http://localhost:5000` (cấu hình trong vite.config.js)
- Hỗ trợ JWT authentication với auto-refresh token
- Không sửa đổi bất kỳ logic backend nào

## 👥 Vai trò người dùng

| Vai trò | Route mặc định | Chức năng chính |
|---------|----------------|-----------------|
| Volunteer | `/tinh-nguyen` | Dashboard, tìm sự kiện, đăng ký, hồ sơ, passport |
| Organizer | `/to-chuc` | Quản lý sự kiện, đăng ký & điểm danh, xác minh |
| Sponsor | `/tai-tro` | Dashboard tài trợ, đề xuất, quyên góp |
| Admin | `/quan-tri` | Quản lý hệ thống, người dùng, xác minh, tài chính |

## ⚠️ Lưu ý

- Project này **hoàn toàn độc lập** với `BaseCore.WebClient`
- Chạy trên port 5174 (WebClient chạy port 5173)
- Không ảnh hưởng đến bất kỳ service backend nào
- Tất cả text hiển thị bằng tiếng Việt có dấu