import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { getAppUrl } from './src/config/env';

// Optional local settings for the @auth scenarios, read from the .env next to this file.
// Variables already set in the shell win.
const envFile = resolve(__dirname, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: ['src/steps/*.ts', 'src/fixtures.ts'],
});

export default defineConfig({
  testDir,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: getAppUrl(),
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
