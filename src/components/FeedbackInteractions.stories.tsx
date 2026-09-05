import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor } from 'storybook/test'
import { AppStatus } from './AppStatus'
import { LoginScreen } from '../auth/LoginScreen'

const meta = {
  title: 'Screens/FeedbackTransitions', component: AppStatus,
  parameters: { layout: 'fullscreen' }, args: { onRetry: fn(), onSignOut: fn() },
} satisfies Meta<typeof AppStatus>
export default meta
type Story = StoryObj<typeof meta>

export const RetryWorkspace: Story = {
  render: function Retry(args) {
    const [failed, setFailed] = useState(true)
    return failed ? <AppStatus {...args} message="Synthetic loading failure" onRetry={() => {
      args.onRetry?.()
      setFailed(false)
    }} /> : <AppStatus />
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(args.onRetry).toHaveBeenCalledOnce()
    await expect(canvas.getByRole('status')).toHaveTextContent('Opening your workspace…')
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}
export const LoginRetry: Story = {
  render: function Retry(args) {
    const [phase, setPhase] = useState('error')
    return <><LoginScreen busy={phase === 'pending'} error={phase === 'error' ? 'Synthetic sign-in failure' : null}
      onSignIn={() => { args.onRetry?.(); setPhase('pending') }} />
      {phase === 'pending' && <button className="bg-white p-3" onClick={() => setPhase('error')}>Simulate failed connection</button>}</>
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Continue with Google' }))
    await expect(args.onRetry).toHaveBeenCalledOnce()
    await expect(canvas.getByRole('button', { name: 'Connecting to Google…' })).toBeDisabled()
    await expect(canvas.getByRole('status')).toHaveTextContent('Connecting to Google…')
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate failed connection' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Continue with Google' })).toBeEnabled())
    await expect(canvas.getByRole('alert')).toHaveTextContent('Synthetic sign-in failure')
  },
}
