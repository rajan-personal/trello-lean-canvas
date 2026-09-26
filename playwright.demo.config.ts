import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/demo',
  timeout: process.env.DEMO_BASE_URL ? 120_000 : 30_000,
  expect: { timeout: process.env.DEMO_BASE_URL ? 30_000 : 5_000 },
  use: { baseURL: process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:4175' },
  webServer: process.env.DEMO_BASE_URL ? undefined : {
    command: 'npm run build:demo && npx vite preview --mode demo --host 127.0.0.1 --port 4175',
    url: 'http://127.0.0.1:4175', reuseExistingServer: false,
  },
})
