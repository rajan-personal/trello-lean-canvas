import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { LoginScreen } from './LoginScreen'

const meta = {
  title: 'Screens/Login',
  component: LoginScreen,
  parameters: { layout: 'fullscreen' },
  args: { busy: false, error: null, onSignIn: fn(), onEmailSignIn: fn() },
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

export const EmailSignIn: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'alex@example.test')
    await userEvent.type(canvas.getByLabelText('Password'), 'example-password')
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in with email' }))
    await expect(args.onEmailSignIn).toHaveBeenCalledWith('alex@example.test', 'example-password')
    await expect(args.onSignIn).not.toHaveBeenCalled()
  },
}
export const GoogleOnlySignUp: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sign up' }))
    await expect(canvas.queryByLabelText('Email')).not.toBeInTheDocument()
    await expect(canvas.queryByLabelText('Password')).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Continue with Google' })).toBeEnabled()
    await expect(canvas.getByText(/Create your account with Google/)).toBeVisible()
  },
}
