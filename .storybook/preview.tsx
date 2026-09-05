import type { Preview } from '@storybook/react-vite'
import { MINIMAL_VIEWPORTS } from 'storybook/viewport'
import { configure } from 'storybook/test'
import '../src/styles.css'

const preview: Preview = {
  beforeAll: () => { configure({ asyncUtilTimeout: 5000 }) },
  beforeEach: () => {
    const keys = () => Object.keys(localStorage).filter((key) => key.startsWith('lean-canvas:'))
    const saved = new Map(keys().map((key) => [key, localStorage.getItem(key)!]))
    keys().forEach((key) => localStorage.removeItem(key))
    return () => {
      keys().forEach((key) => localStorage.removeItem(key))
      saved.forEach((value, key) => localStorage.setItem(key, value))
    }
  },
  parameters: {
    viewport: { options: MINIMAL_VIEWPORTS },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
}

export default preview
