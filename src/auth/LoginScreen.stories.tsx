import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { LoginScreen } from './LoginScreen'

const meta = {
  title: 'Screens/Login',
  component: LoginScreen,
  parameters: { layout: 'fullscreen' },
  args: { busy: false, error: null, onSignIn: fn() },
} satisfies Meta<typeof LoginScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Continue with Google' })
    await expect(button).toBeEnabled()
    await userEvent.click(button)
    await expect(args.onSignIn).toHaveBeenCalledOnce()
  },
}

export const Error: Story = {
  args: { error: 'Google sign-in failed. Please try again.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
  },
}

export const Busy: Story = {
  args: { busy: true },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Connecting to Google…' })
    await expect(button).toBeDisabled()
    await userEvent.click(button)
    await expect(args.onSignIn).not.toHaveBeenCalled()
    await expect(canvas.getByRole('status')).toHaveTextContent('Connecting to Google…')
  },
}
