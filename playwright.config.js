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
      name: 'tests',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.js/,
      use: {
        storageState: 'auth.json',
      },
    },
  ]
});

