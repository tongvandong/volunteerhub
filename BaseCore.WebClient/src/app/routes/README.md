# Routes

Thu muc nay la noi bat dau khi debug dieu huong frontend.

```text
AppRoutes.jsx      # Render danh sach route tu routeConfig
routeConfig.jsx    # URL, layout, role nao duoc vao trang nao
pageRegistry.jsx   # Lazy import page component theo ten
RouteShells.jsx    # PublicRoute, AppPage, ProtectedRoute + layout shell
PageLoader.jsx     # Loading fallback
```

Quy trinh lan loi:

1. URL co render dung page khong: xem `routeConfig.jsx`.
2. Page import tu file nao: xem `pageRegistry.jsx`.
3. Bi day ve login hoac bi chan role: xem `RouteShells.jsx` va `components/ProtectedRoute.jsx`.
4. Layout public/app/shared co khac nhau khong: xem `components/layouts/`.
