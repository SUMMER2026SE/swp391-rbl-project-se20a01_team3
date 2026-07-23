import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 45_000,
  retries: 2,
  use: {
    baseURL: process.env.COPS_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  outputDir: '../../output/logs/playwright-artifacts',
});
