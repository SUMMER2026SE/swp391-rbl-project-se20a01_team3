import { test } from '@playwright/test';
import { login, resetState } from './helpers';

test('Parent portal smoke flow', async ({ page }) => {
  await resetState(page);
  await login(page, 'PARENT_EMAIL', 'PARENT_PASSWORD');
  await page.goto('/parent/progress');
});
