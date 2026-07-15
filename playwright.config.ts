import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  timeout: 30_000,
  expect: {timeout: 5_000},
  use: {
    baseURL: 'http://127.0.0.1:4188',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4188 --strictPort',
    url: 'http://127.0.0.1:4188',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {name: 'chromium-desktop', use: {...devices['Desktop Chrome']}},
    {name: 'chromium-mobile', use: {...devices['Pixel 5']}},
    {name: 'webkit-desktop', use: {...devices['Desktop Safari']}},
    {name: 'firefox-desktop', use: {...devices['Desktop Firefox']}},
  ],
});
