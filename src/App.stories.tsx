import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import App from './App'

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
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Airbnb — 2008' })).toBeInTheDocument()
    await expect(canvas.getByText('Booking fees from travellers')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Load sample data' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Add canvas' })).toBeInTheDocument()
  },
}
