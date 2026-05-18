import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.js';

// Test cho lỗi "không bấm được nút Hủy sự kiện" trên trang ManageEvent.
// File: BaseCore.WebClient/src/pages/organizer/ManageEvent.jsx
//
// Strategy:
//   1. Login organizer
//   2. Vào /my-events, tìm event có thể hủy (status Pending hoặc Approved).
//      Nút "Hủy sự kiện" chỉ render với 2 status đó (xem code ManageEvent.jsx ~ dòng 732).
//   3. Vào /events/:id/manage và bấm nút.
test.describe('Organizer · Hủy sự kiện', () => {
  test('Modal mở khi bấm nút Hủy sự kiện', async ({ page }) => {
    await login(page, 'organizer');

    // Lấy danh sách event của organizer qua API (token đã có sau login).
    const events = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/events/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    });

    expect(events, 'API /api/events/my phải trả về dữ liệu').toBeTruthy();

    const list = Array.isArray(events) ? events : events?.items ?? events?.data ?? [];
    const target = list.find((e) => e.status === 'Pending' || e.status === 'Approved');

    test.skip(!target, 'Không có event Pending/Approved để test hủy');

    await page.goto(`/events/${target.id}/manage`);
    await page.waitForLoadState('networkidle');

    const cancelBtn = page.getByRole('button', { name: /hủy sự kiện/i }).first();
    await expect(cancelBtn, 'Nút Hủy sự kiện phải hiển thị').toBeVisible({ timeout: 10_000 });
    await expect(cancelBtn, 'Nút phải enable').toBeEnabled();

    await cancelBtn.click();

    const modalTitle = page.getByRole('heading', { name: /hủy sự kiện/i });
    await expect(modalTitle, 'Modal phải mở sau khi click').toBeVisible({ timeout: 5_000 });

    await page.screenshot({ path: 'test-results/cancel-event-modal.png', fullPage: true });
  });
});
