import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { AccountButton } from './AccountButton'

const user = { uid: 'storybook-user', displayName: 'Storybook User', email: 'storybook@example.com', photoURL: null }
const meta = {
  title: 'Lean Canvas/AccountButton', component: AccountButton, tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[248px] bg-[#07558f] p-3"><Story /></div>],
  args: { user, onSignOut: fn() },
} satisfies Meta<typeof AccountButton>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('storybook@example.com')).toBeVisible()
    await expect(within(document.body).queryByRole('menuitem')).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Account storybook@example.com' }))
    await userEvent.click(within(document.body).getByRole('menuitem', { name: 'Sign out storybook@example.com' }))
    await expect(args.onSignOut).toHaveBeenCalledOnce()
  },
}
export const EmailFallback: Story = {
  args: { user: { ...user, displayName: null } },
  play: async ({ canvas }) => { await expect(canvas.getByText('storybook@example.com')).toBeVisible() },
}
export const MissingFields: Story = {
  args: { user: { ...user, displayName: null, email: null } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Account Google account' }))
    await expect(within(document.body).getByRole('menuitem', { name: 'Sign out Google account' })).toBeEnabled()
  },
}
export const LongFields: Story = {
  args: { user: { ...user, displayName: 'A very long synthetic account name '.repeat(5), email: `${'synthetic'.repeat(12)}@example.test` } },
  play: async ({ canvas, args }) => {
    const email = canvas.getByTitle(args.user.email!)
    await expect(email.scrollWidth).toBeGreaterThan(email.clientWidth)
    const button = canvas.getByRole('button', { name: `Account ${args.user.email}` })
    await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth)
  },
}
