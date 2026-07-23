import { test } from '@playwright/test';
import { login, resetState } from './helpers';

test('Teacher portal smoke flow', async ({ page }) => {
  await resetState(page);
  await login(page, 'TEACHER_EMAIL', 'TEACHER_PASSWORD');
  await page.goto('/teacher/courses');
});
