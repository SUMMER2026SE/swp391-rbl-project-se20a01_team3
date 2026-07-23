import { test, expect } from '@playwright/test';
import { resetState } from './helpers';

test('Guest tìm kiếm và xem chi tiết khóa học', async ({ page }) => {
  await resetState(page);
  await page.goto('/courses');
  await expect(page.getByRole('heading', { name: 'Khám Phá Khóa Học' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Công Nghệ 6' })).toBeVisible();
  await page.getByRole('heading', { name: 'Công Nghệ 6' }).click();
  await expect(page.getByRole('heading', { name: 'Công Nghệ 6', level: 1 })).toBeVisible();
});
