import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir:'./tests/remote',testMatch:'postgres.spec.ts',workers:1,
  use:{launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?['--no-sandbox','--disable-dev-shm-usage']:[]},baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:900},trace:'retain-on-failure'},
  webServer:[
    {command:'node --import tsx integration/serve.ts',url:'http://127.0.0.1:8787/api/health',timeout:60000},
    {command:'npm run build -- --mode postgres-test && npm run preview -- --host 127.0.0.1',url:'http://127.0.0.1:4173',timeout:60000},
  ],
})
