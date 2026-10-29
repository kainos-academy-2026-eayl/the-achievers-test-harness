import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:8000',
    testIdAttribute: 'id',
  },
  webServer: {
    command: 'npm run dev',               // replace with the frontend's real start command
    cwd: '../the-achievers-frontend',     // adjust to where the folder actually is
    url: 'http://localhost:8000',
    reuseExistingServer: true,
  },
});
