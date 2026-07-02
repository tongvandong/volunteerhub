# Frontend Source Map

Thu muc nay duoc to chuc theo luong debug thu cong:

```text
app/          # Boot app, provider, route config
api/          # HTTP client va endpoint theo mien nghiep vu
components/   # Layout va UI dung lai
contexts/     # State dung chung toan app
pages/        # Man hinh theo khu vuc/role
services/     # Shim tuong thich import cu
utils/        # Ham pure/helper khong phu thuoc UI
```

Bat dau debug theo thu tu:

1. URL/role/layout: `app/routes/routeConfig.jsx`.
2. Page nao duoc render: `app/routes/pageRegistry.jsx`.
3. Request bi loi: `api/httpClient.js`, sau do vao `api/modules/`.
4. UI man hinh bi loi: `pages/<area>/`.
5. Component dung lai bi loi: `components/ui/` hoac `components/layouts/`.
