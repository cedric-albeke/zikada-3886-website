import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 10 * 60 * 1000, // 10 minutes
  testDir: 'tests/e2e',
  use: {
    headless: true,
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    // Build before preview so multi-page entries like control-panel.html exist in dist
    command: 'npm run build && npm run preview',
    port: 3886,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
