import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: globalThis.process?.env.GITHUB_ACTIONS ? '/trello-lean-canvas/' : '/',
  plugins: [react(), tailwindcss()],
})
