import { defineConfig, devices } from '@playwright/test';
import { adminConfig } from './config/env.config';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  expect: {
    timeout: adminConfig.expectTimeout,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: adminConfig.baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: adminConfig.actionTimeout,
    navigationTimeout: adminConfig.navigationTimeout,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});