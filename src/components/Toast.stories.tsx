import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Toast } from './Toast'

const meta = {
  title: 'Lean Canvas/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { notice: 'Canvas saved automatically' },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Visible: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Canvas saved automatically',
    )
  },
}

export const Hidden: Story = {
  args: { notice: '' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument()
  },
}
