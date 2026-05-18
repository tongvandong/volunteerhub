import { test, expect } from '@playwright/test';
import { login, ACCOUNTS } from './helpers/auth.js';

// Smoke test cơ bản: trang public + login với 4 role.
test.describe('Smoke', () => {
  test('Landing page render được', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/volunteerhub/i);
    await page.screenshot({ path: 'test-results/landing.png', fullPage: true });
  });

  test('Public events page hiển thị danh sách', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });

  for (const role of Object.keys(ACCOUNTS)) {
    test(`Login với role ${role}`, async ({ page }) => {
      await login(page, role);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });
  }
});
