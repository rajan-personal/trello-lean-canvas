import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
export default defineConfig({
  root: file('./staging'), base: '/', publicDir: file('./staging/public'),
  build: { outDir: file('./dist-staging'), emptyOutDir: true },
  resolve: { alias: [
    { find: /^firebase\/firestore$/, replacement: file('./staging/firestore-disabled.ts') },
    { find: /^(\.\.\/)+firebase$/, replacement: file('./staging/firebase-disabled.ts') },
  ] },
  plugins: [react(), tailwindcss(), {
    name: 'require-local-only-staging',
    moduleParsed({ id }) {
      if (id.includes('/node_modules/@firebase/') || id === file('./src/firebase.ts') || id.endsWith('/auth/AuthProvider.tsx'))
        throw new Error('Staging must not include Firebase or production authentication.')
    },
  }],
})
