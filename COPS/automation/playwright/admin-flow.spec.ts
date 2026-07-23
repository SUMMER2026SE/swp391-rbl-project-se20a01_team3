import { test } from '@playwright/test';
import { login, resetState } from './helpers';

test('Admin portal smoke flow', async ({ page }) => {
  await resetState(page);
  await login(page, 'ADMIN_EMAIL', 'ADMIN_PASSWORD');
  await page.goto('/admin');
});
