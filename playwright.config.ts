import { defineConfig } from '@playwright/test';
import { assertLocalTestEnvironment } from './tests/local-safety';
assertLocalTestEnvironment();
export default defineConfig({
  testDir: './tests', testMatch: ['workflow.spec.ts', 'registration.spec.ts', 'account-access.spec.ts', 'verification.spec.ts', 'reports-ratings.spec.ts'], fullyParallel: false, workers: 1,
  timeout: 120000, expect: { timeout: 30000 }, reporter: 'list',
  use: {
    baseURL: process.env.NEXTAUTH_URL || 'http://localhost:3100',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] } : undefined,
    screenshot: 'only-on-failure', trace: 'off',
  },
  webServer: {
    command: process.env.FIXTRACK_TEST_PRODUCTION_BUILD === '1'
      ? 'npm run start -- --hostname 127.0.0.1 --port 3100'
      : `npm run dev -- ${process.env.FIXTRACK_TEST_WEBPACK === '1' ? '--webpack ' : ''}--hostname 127.0.0.1 --port 3100`,
    url: 'http://localhost:3100/api/auth/csrf', reuseExistingServer: false, timeout: 180000,
    stdout: 'ignore', stderr: 'pipe',
  },
});
