import { defineConfig } from 'vitest/config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

export default defineConfig({
  plugins: [storybookTest({ configDir: '.storybook' })],
  test: {
    name: 'storybook',
    testTimeout: 15000,
    browser: {
      enabled: true, provider: 'playwright', headless: true,
      instances: [{ browser: 'chromium' }],
    },
    maxWorkers: 2,
  },
})
