import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { AccountButton } from './AccountButton'

const user = {
  uid: 'storybook-user',
  displayName: 'Storybook User',
  email: 'storybook@example.com',
  photoURL: null,
}

const meta = {
  title: 'Lean Canvas/AccountButton',
  component: AccountButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[248px] bg-[#07558f] p-3"><Story /></div>
    ),
  ],
  args: { user, onSignOut: fn() },
} satisfies Meta<typeof AccountButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('Storybook User')).toBeInTheDocument()
    await expect(canvas.getByText('storybook@example.com')).toBeInTheDocument()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Sign out storybook@example.com' }),
    )
    await expect(args.onSignOut).toHaveBeenCalledOnce()
  },
}

export const EmailFallback: Story = {
  args: { user: { ...user, displayName: null } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('storybook@example.com')).toBeInTheDocument()
    await expect(canvas.getByText('S')).toBeInTheDocument()
  },
}
