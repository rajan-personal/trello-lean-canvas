import { expect, within } from 'storybook/test'
import App from './App.jsx'

const STORAGE_KEY = 'lean-canvas:v2'

const meta = {
  title: 'Screens/LeanCanvasWorkspace',
  component: App,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    chromatic: { viewports: [1440] },
    docs: {
      description: {
        component: 'The complete Trello-style workspace with independent Lean Canvases and local persistence.',
      },
    },
  },
  beforeEach: () => {
    localStorage.removeItem(STORAGE_KEY)
  },
}

export default meta

export const Default = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('main')).toBeEmptyDOMElement()
    await expect(canvas.getByRole('button', { name: 'Add canvas' })).toBeInTheDocument()
  },
}
