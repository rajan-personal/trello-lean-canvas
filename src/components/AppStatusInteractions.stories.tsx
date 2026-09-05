import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, mocked, waitFor } from 'storybook/test'
import { AppStatus } from './AppStatus'

const meta = {
  title: 'Lean Canvas/AppStatusActions', component: AppStatus,
  parameters: { layout: 'fullscreen' },
  args: { message: 'Synthetic loading failure', onRetry: fn(), onSignOut: fn() },
} satisfies Meta<typeof AppStatus>
export default meta
type Story = StoryObj<typeof meta>

export const RetryFailures: Story = {
  play: async ({ args, canvas, userEvent }) => {
    mocked(args.onRetry!).mockImplementationOnce(() => { throw new Error('Synthetic throw') })
      .mockRejectedValueOnce(new Error('Synthetic rejection'))
    for (let attempt = 1; attempt <= 2; attempt++) {
      await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
      await expect(await canvas.findByText('Retry failed. Please try again.')).toHaveAttribute('role', 'alert')
      await expect(args.onRetry).toHaveBeenCalledTimes(attempt)
      await expect(canvas.getByRole('button', { name: 'Retry' })).toBeEnabled()
      await expect(canvas.getByRole('button', { name: 'Sign out' })).toBeEnabled()
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(args.onRetry).toHaveBeenCalledTimes(3)
    await expect(canvas.queryByText('Retry failed. Please try again.')).not.toBeInTheDocument()
  },
}

export const PendingSignOutFailure: Story = {
  play: async ({ args, canvas, userEvent }) => {
    let reject!: (error: Error) => void
    mocked(args.onSignOut!).mockImplementationOnce(() => new Promise<void>((_, fail) => { reject = fail }))
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out' }))
    await expect(canvas.getByRole('button', { name: 'Signing out…' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Signing out…' })).toHaveAttribute('aria-busy', 'true')
    const retry = canvas.getByRole('button', { name: 'Retry' })
    await expect(retry).toBeDisabled()
    await userEvent.click(retry)
    await expect(args.onRetry).not.toHaveBeenCalled()
    reject(new Error('Synthetic sign-out rejection'))
    await expect(await canvas.findByText('Sign out failed. Please try again.')).toHaveAttribute('role', 'alert')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Sign out' })).toBeEnabled())
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out' }))
    await expect(args.onSignOut).toHaveBeenCalledTimes(2)
    await expect(canvas.queryByText('Sign out failed. Please try again.')).not.toBeInTheDocument()
  },
}
