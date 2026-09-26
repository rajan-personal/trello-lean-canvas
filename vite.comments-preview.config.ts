import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// A separate, local-storage-only demo. Never deploy this configuration to production.
export default defineConfig({
  root: 'preview', publicDir: '../public', plugins: [react(), tailwindcss()],
  build: { outDir: '../dist-preview', emptyOutDir: true, chunkSizeWarningLimit: 600 },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: ['.on.boat.dev'] },
})
