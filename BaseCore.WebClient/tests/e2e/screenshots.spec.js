// Tự động chụp full-page screenshot toàn bộ trang của 4 vai trò + trang public.
// Ảnh lưu ở docs/screenshots/<nhóm>/<NN-tên-trang>.png
// Chạy: npx playwright test screenshots.spec.js   (yêu cầu Vite :3000 + backend đang chạy)
import { test } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { storageStateFor } from './helpers/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// tests/e2e -> WebClient -> repo root -> docs/screenshots
const OUT = path.resolve(__dirname, '../../../docs/screenshots');

// Chờ trang ổn định: spinner Suspense biến mất + lắng đọng ảnh/animation.
async function settle(page) {
  await page.locator('.animate-spin').first().waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(700);
}

async function shot(page, dir, idx, name, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const file = path.join(OUT, dir, `${String(idx).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
}

test.describe('Public (không đăng nhập)', () => {
  test('public pages', async ({ page }) => {
    test.setTimeout(120_000);
    const pages = [
      ['landing', '/'],
      ['events', '/events'],
      ['event-detail', '/events/1'],
      ['verify-certificate', '/verify/check'],
      ['login', '/login'],
      ['register', '/register'],
    ];
    for (let i = 0; i < pages.length; i++) await shot(page, 'public', i + 1, pages[i][0], pages[i][1]);
  });
});

test.describe('Volunteer', () => {
  test.use({ storageState: storageStateFor('volunteer') });
  test('volunteer pages', async ({ page }) => {
    test.setTimeout(120_000);
    const pages = [
      ['dashboard', '/dashboard'],
      ['notifications', '/notifications'],
      ['profile', '/profile'],
      ['passport', '/profile?tab=passport'],
      ['activity-registrations', '/activity'],
      ['activity-donations', '/activity?tab=donations'],
      ['achievements-badges', '/achievements'],
      ['achievements-certificates', '/achievements?tab=certificates'],
    ];
    for (let i = 0; i < pages.length; i++) await shot(page, 'volunteer', i + 1, pages[i][0], pages[i][1]);
  });
});

test.describe('Organizer', () => {
  test.use({ storageState: storageStateFor('organizer') });
  test('organizer pages', async ({ page }) => {
    test.setTimeout(180_000);
    const pages = [
      ['dashboard', '/dashboard'],
      ['notifications', '/notifications'],
      ['my-events', '/my-events'],
      ['event-create', '/events/create'],
      ['verification', '/organizer/verification'],
      ['insights', '/organizer/insights'],
    ];
    let i = 0;
    for (; i < pages.length; i++) await shot(page, 'organizer', i + 1, pages[i][0], pages[i][1]);

    // Lấy event id thật của organizer từ trang "Sự kiện của tôi" để chụp trang Quản lý.
    await page.goto('/my-events', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const manageLink = page.locator('a[href*="/manage"]').first();
    await manageLink.waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {});
    const href = await manageLink.getAttribute('href', { timeout: 5_000 }).catch(() => null);
    const m = href && href.match(/\/events\/(\d+)\/manage/);
    if (m) {
      const id = m[1];
      const tabs = ['registrations', 'checkin', 'shifts', 'campaigns', 'corporate', 'report'];
      for (const tab of tabs) {
        i++;
        await shot(page, 'organizer', i + 1, `manage-${tab}`, `/events/${id}/manage?tab=${tab}`);
      }
    } else {
      console.warn('[screenshots] Không tìm thấy event id để chụp trang Quản lý sự kiện.');
    }
  });
});

test.describe('Sponsor', () => {
  test.use({ storageState: storageStateFor('sponsor') });
  test('sponsor pages', async ({ page }) => {
    test.setTimeout(120_000);
    const pages = [
      ['dashboard', '/dashboard'],
      ['notifications', '/notifications'],
      ['my-sponsorships', '/my-sponsorships'],
      ['sponsor-profile', '/sponsor/profile'],
    ];
    for (let i = 0; i < pages.length; i++) await shot(page, 'sponsor', i + 1, pages[i][0], pages[i][1]);
  });
});

test.describe('Admin', () => {
  test.use({ storageState: storageStateFor('admin') });
  test('admin pages', async ({ page }) => {
    test.setTimeout(180_000);
    const pages = [
      ['dashboard', '/dashboard'],
      ['notifications', '/notifications'],
      ['events', '/admin/events'],
      ['users', '/admin/users'],
      ['users-volunteers', '/admin/users?tab=volunteers'],
      ['users-sponsors', '/admin/users?tab=sponsors'],
      ['verifications-organizers', '/admin/verifications?tab=organizers'],
      ['verifications-volunteers', '/admin/verifications?tab=volunteers'],
      ['catalog-categories', '/admin/catalog?tab=categories'],
      ['catalog-skills', '/admin/catalog?tab=skills'],
      ['catalog-badges', '/admin/catalog?tab=badges'],
      ['ratings', '/admin/ratings'],
      ['finance', '/admin/finance'],
      ['monitoring', '/admin/monitoring'],
      ['export', '/admin/export'],
    ];
    for (let i = 0; i < pages.length; i++) await shot(page, 'admin', i + 1, pages[i][0], pages[i][1]);
  });
});
