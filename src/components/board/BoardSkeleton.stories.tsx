import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { BoardSkeleton } from './BoardSkeleton'

const meta = {
  title: 'Kanban/BoardSkeleton', component: BoardSkeleton, tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <main className="kanban-area" style={{ height: '100dvh', background: 'var(--color-app-bg)' }}><Story /></main>],
} satisfies Meta<typeof BoardSkeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading board…')
    const columns = canvasElement.querySelectorAll('.sk-column')
    await expect(columns).toHaveLength(4)
    await waitFor(() => expect(columns[0]).toBeVisible())
    await expect(canvasElement.querySelectorAll('.sk-column > .sk-block:not(.sk-header):not(.sk-add-card)')).toHaveLength(10)
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

export const ReducedMotion: Story = {
  parameters: { docs: { description: { story: 'Enable prefers-reduced-motion: reduce in browser rendering settings. The skeleton uses static blocks at 50% opacity, without shimmer.' } } },
}
