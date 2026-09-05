import { defineConfig } from 'vite'

// Production's PWA must never precache Storybook. JSX uses the project's tsconfig.
export default defineConfig({})
