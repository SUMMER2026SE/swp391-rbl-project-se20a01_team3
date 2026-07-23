import { test } from '@playwright/test';
import { login, resetState } from './helpers';

test('Student portal smoke flow', async ({ page }) => {
  await resetState(page);
  await login(page, 'STUDENT_EMAIL', 'STUDENT_PASSWORD');
  await page.goto('/student/courses');
});
