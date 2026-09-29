import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { PasswordDialog } from './PasswordDialog'

const meta = {
  title: 'Screens/Password settings', component: PasswordDialog,
  parameters: { layout: 'fullscreen' },
  args: { email: 'alex@example.test', hasPassword: false, onSave: fn(async () => {}), onClose: fn() },
} satisfies Meta<typeof PasswordDialog>
export default meta
type Story = StoryObj<typeof meta>
async function fillPassword() {
  const dialog = within(document.body).getByRole('dialog')
  const canvas = within(dialog)
  await userEvent.type(canvas.getByLabelText('New password'), 'example-password')
  await userEvent.type(canvas.getByLabelText('Confirm password'), 'example-password')
  return canvas
}
export const SetPassword: Story = {}
export const ChangePassword: Story = { args: { hasPassword: true } }
export const SavePassword: Story = {
  play: async ({ args }) => {
    const canvas = await fillPassword()
    await userEvent.click(canvas.getByRole('button', { name: 'Verify with Google and save' }))
    await expect(args.onSave).toHaveBeenCalledWith('example-password')
    await expect(await canvas.findByRole('heading', { name: 'Password saved' })).toBeVisible()
    await expect(canvas.queryByLabelText('New password')).not.toBeInTheDocument()
  },
}
export const MismatchedPasswords: Story = {
  play: async ({ args }) => {
    const canvas = await fillPassword()
    await userEvent.type(canvas.getByLabelText('Confirm password'), 'different')
    await userEvent.click(canvas.getByRole('button', { name: 'Verify with Google and save' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('Passwords do not match.')
    await expect(args.onSave).not.toHaveBeenCalled()
  },
}
export const VerificationCancelled: Story = {
  args: { onSave: fn(async () => { throw { code: 'auth/popup-closed-by-user' } }) },
  play: async () => {
    const canvas = await fillPassword()
    await userEvent.click(canvas.getByRole('button', { name: 'Verify with Google and save' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Google sign-in was cancelled.')
    await expect(canvas.getByRole('button', { name: 'Verify with Google and save' })).toBeEnabled()
  },
}
export const PendingVerification: Story = {
  args: { onSave: fn(() => new Promise<void>(() => {})) },
  play: async ({ args }) => {
    const canvas = await fillPassword()
    await userEvent.click(canvas.getByRole('button', { name: 'Verify with Google and save' }))
    await expect(canvas.getByRole('button', { name: 'Verifying and saving…' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    await expect(args.onClose).not.toHaveBeenCalled()
  },
}
