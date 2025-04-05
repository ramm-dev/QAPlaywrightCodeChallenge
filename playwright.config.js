// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const config = require('./utils/config-loader');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  globalSetup: require.resolve('./global-setup.js'),
  reporter: 'html',
  use: {
    // Use stored auth state
    storageState: 'auth.json',
    baseURL: process.env.BASE_URL,
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  retries: 1,
  workers: 1,
  fullyParallel: false,
  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.js/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'auth.json',
      },
    },
    {
      name: 'firefox',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.js/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'auth.json',
      },
    },
    {
      name: 'webkit',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.js/,
      use: {
        ...devices['Desktop Safari'],
        storageState: 'auth.json',
      },
    },
  ]
});

