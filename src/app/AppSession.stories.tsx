import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, mocked, waitFor } from 'storybook/test'
import { SessionFixture } from './AppSession.story-support'

const meta = {
  title: 'Screens/AppSession', component: SessionFixture,
  parameters: { layout: 'fullscreen', docs: { story: { inline: false } } },
  args: { state: {
    user: { uid: 'story-session', displayName: 'Synthetic User', email: null, photoURL: null },
    busy: false, loading: false, error: null, signIn: fn(async () => {}), signOut: fn(async () => {}),
  } },
} satisfies Meta<typeof SessionFixture>
export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { state: { ...meta.args.state, loading: true } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('status')).toHaveTextContent('Opening your workspace…')
  },
}
export const SignOut: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Sign out Synthetic User' }))
    await expect(await canvas.findByRole('button', { name: 'Continue with Google' })).toBeEnabled()
    await expect(args.state.signOut).toHaveBeenCalledOnce()
    await expect(canvas.queryByRole('tab')).not.toBeInTheDocument()
  },
}
export const FailedSignOutAndRetry: Story = {
  play: async ({ canvas, userEvent, args }) => {
    let fail!: (reason: Error) => void
    mocked(args.state.signOut).mockImplementationOnce(() => new Promise<void>((_, reject) => { fail = reject }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Sign out Synthetic User' }))
    await expect(canvas.getByRole('button', { name: 'Signing out Synthetic User' })).toBeDisabled()
    fail(new Error('Synthetic failure'))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Sign out failed. Please try again.')
    await expect(canvas.getByRole('heading', { name: 'Blank canvas' })).toBeVisible()
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Sign out Synthetic User' })).toBeEnabled())
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out Synthetic User' }))
    await expect(await canvas.findByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await expect(args.state.signOut).toHaveBeenCalledTimes(2)
  },
}
