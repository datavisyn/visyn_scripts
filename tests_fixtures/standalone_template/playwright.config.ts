import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? '100%' : '50%',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    testIdAttribute: 'data-testid',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Capture screenshot after each test failure: https://playwright.dev/docs/test-use-options#recording-options */
    screenshot: 'only-on-failure',
    /* Capture video */
    video: 'on-first-retry',
  },
  expect: { timeout: 30000 },
  timeout: 3 * 1000 * 60,
  globalTimeout: 10 * 60 * 1000,
  /* Configure projects for major browsers */
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--allow-file-access-from-files'],
        },
      },
      dependencies: ['setup'],
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'yarn start dev_server_only=true',
      url: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8080',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
