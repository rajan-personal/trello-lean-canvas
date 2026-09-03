import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { AppStatus } from './AppStatus'

const meta = {
  title: 'Lean Canvas/AppStatus',
  component: AppStatus,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onSignOut: fn() },
} satisfies Meta<typeof AppStatus>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { message: undefined, onSignOut: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Opening your workspace…',
    )
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

export const Error: Story = {
  args: { message: 'The workspace could not be synchronized.' },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'The workspace could not be synchronized.',
    )
    await expect(canvas.getByRole('button', { name: 'Retry' }))
      .toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out' }))
    await expect(args.onSignOut).toHaveBeenCalledOnce()
  },
}
