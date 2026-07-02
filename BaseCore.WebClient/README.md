# VolunteerHub WebClient

Day la frontend chinh cua project. Docker production build tu thu muc nay.

## Cau truc

```text
src/
  app/
    App.jsx                 # Gan Router + AuthProvider
    routes/
      AppRoutes.jsx         # Render danh sach route
      PageLoader.jsx        # Loading fallback dung chung cho lazy route
      pageRegistry.jsx      # Lazy import page component theo ten
      RouteShells.jsx       # PublicRoute, AppPage, layout shell
      routeConfig.jsx       # URL, layout, role guard, redirect route
  api/
    httpClient.js           # Axios instance, bearer token, auto refresh token
    authStorage.js          # Doc/ghi token va user trong localStorage
    modules/                # API tach theo mien nghiep vu
      admin.js
      auth.js
      engagement.js
      events.js
      files.js
      finance.js
      profiles.js
    index.js                # Export API tap trung
  components/
    layouts/                # MainLayout, PublicLayout, SharedLayout
    ui/                     # Component dung lai nhieu noi
  contexts/
    AuthContext.jsx         # Trang thai dang nhap, role helper
  pages/
    admin/
    auth/
    organizer/
    public/
    shared/
    sponsor/
    volunteer/
  services/
    api.js                  # Shim tuong thich: export lai tu src/api
  utils/
```

## Cach lan loi nhanh

1. Loi khong vao dung trang hoac bi redirect: xem `src/app/routes/AppRoutes.jsx`.
2. URL, layout, role cua tung trang: xem `src/app/routes/routeConfig.jsx`.
3. Page component nao dang duoc import: xem `src/app/routes/pageRegistry.jsx`.
4. Loi bi chan theo role: xem `src/app/routes/RouteShells.jsx`, `src/components/ProtectedRoute.jsx` va `src/contexts/AuthContext.jsx`.
5. Loi request API, token, 401, refresh token: xem `src/api/httpClient.js`.
6. Loi endpoint theo nghiep vu:
   - dang nhap/dang ky: `src/api/modules/auth.js`
   - su kien/dang ky/phong van: `src/api/modules/events.js`
   - thong bao/channel/badge/rating: `src/api/modules/engagement.js`
   - profile/skill/sponsor profile: `src/api/modules/profiles.js`
   - tai tro/quyen gop: `src/api/modules/finance.js`
   - upload/chung chi: `src/api/modules/files.js`
   - admin/dashboard: `src/api/modules/admin.js`
7. Loi UI theo man hinh: vao dung folder trong `src/pages/<role-or-area>/`.

## Lenh hay dung

```bash
npm run dev
npm run build
npm run test:e2e
```

Khi debug local, Vite proxy `/api` qua ApiGateway o `http://localhost:5000`, cau hinh trong `vite.config.js`.
