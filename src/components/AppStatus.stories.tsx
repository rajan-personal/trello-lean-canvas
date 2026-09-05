import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, mocked, waitFor } from 'storybook/test'
import { AppStatus } from './AppStatus'

const meta = {
  title: 'Lean Canvas/AppStatus',
  component: AppStatus,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onSignOut: fn(), onRetry: fn() },
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

export const PendingRetry: Story = {
  args: { message: 'The workspace could not be synchronized.' },
  play: async ({ args, canvas, userEvent }) => {
    let finish!: () => void
    mocked(args.onRetry!).mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve }))
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    const retry = canvas.getByRole('button', { name: 'Retrying…' })
    await expect(retry).toBeDisabled()
    await expect(retry).toHaveAttribute('aria-busy', 'true')
    await expect(canvas.getByRole('button', { name: 'Sign out' })).toBeDisabled()
    await userEvent.click(retry)
    await expect(args.onRetry).toHaveBeenCalledOnce()
    finish()
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Retry' })).toBeEnabled())
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
