import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { SyncError } from './SyncError'

const meta = {
  title: 'Lean Canvas/SyncError',
  component: SyncError,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { message: 'Changes could not be synchronized.' },
} satisfies Meta<typeof SyncError>

export default meta
type Story = StoryObj<typeof meta>

export const Visible: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'Changes could not be synchronized.',
    )
  },
}
