import { expect, Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function resetState(page: Page) {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
}

export async function login(page: Page, emailKey: string, passwordKey: string) {
  const email = process.env[emailKey];
  const password = process.env[passwordKey];
  if (!email || !password) throw new Error(`Thiếu biến môi trường ${emailKey}/${passwordKey}`);
  await page.goto('/login');
  await page.getByPlaceholder('Nhập email của bạn').fill(email);
  await page.getByPlaceholder('Nhập mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng Nhập' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

export async function captureHighlighted(page: Page, locator: ReturnType<Page['locator']>, outputFile: string) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Không lấy được bounding box của phần tử mục tiêu');
  await page.evaluate(({ x, y, width, height }) => {
    document.getElementById('__cops_highlight__')?.remove();
    const overlay = document.createElement('div');
    overlay.id = '__cops_highlight__';
    Object.assign(overlay.style, {
      position: 'fixed', pointerEvents: 'none', background: 'transparent',
      border: '3px solid #FF0000', boxSizing: 'border-box', zIndex: '2147483647',
      borderRadius: '2px', left: `${x - 6}px`, top: `${y - 6}px`,
      width: `${width + 12}px`, height: `${height + 12}px`,
    });
    document.body.appendChild(overlay);
  }, box);
  await page.waitForTimeout(250);
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await page.screenshot({ path: outputFile });
  await page.evaluate(() => document.getElementById('__cops_highlight__')?.remove());
}
