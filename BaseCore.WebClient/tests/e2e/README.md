# Playwright E2E Tests · VolunteerHub WebClient

End-to-end tests dùng Playwright + Chromium.

## Yêu cầu trước khi chạy

Phải có các services backend + frontend đang chạy:

| Service | Port |
| --- | --- |
| ApiGateway | 5000 |
| AuthService | 5002 |
| EventService | 5003 |
| FinanceService | 5004 |
| Vite dev server | 3000 |

Mở 5 terminal hoặc dùng script chạy đồng thời, ví dụ:

```powershell
# Terminal 1-4: backend services
dotnet run --project BaseCore.ApiGateway
dotnet run --project BaseCore.AuthService
dotnet run --project BaseCore.EventService
dotnet run --project BaseCore.FinanceService

# Terminal 5: frontend
cd BaseCore.WebClient
npm run dev
```

## Chạy test

```powershell
cd BaseCore.WebClient

# Headless (mặc định)
npm run test:e2e

# Có browser hiển thị
npm run test:e2e:headed

# UI mode (interactive)
npm run test:e2e:ui

# Xem report HTML sau khi chạy
npm run test:e2e:report
```

## Cấu trúc

```
tests/e2e/
├── helpers/
│   └── auth.js         # Helper login dùng chung
├── cancel-event.spec.js  # Test nút "Hủy sự kiện"
└── README.md
```

## Tài khoản demo

- `admin / admin123`
- `organizer / organizer123`
- `volunteer / volunteer123`
- `sponsor / sponsor123`

Dùng helper:

```js
import { login } from './helpers/auth.js';

test('...', async ({ page }) => {
  await login(page, 'organizer');
  // ...
});
```

## Biến môi trường

| Biến | Mặc định | Mô tả |
| --- | --- | --- |
| `E2E_BASE_URL` | `http://localhost:3000` | URL frontend |
