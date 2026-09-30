import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { AccountButton } from './AccountButton'

const meta = {
  title: 'Lean Canvas/Account menu', component: AccountButton,
  args: { user: { uid: 'synthetic-account', displayName: 'Alex Morgan', email: 'alex@example.test', photoURL: null },
    onSignOut: fn(), onSetPassword: fn(async () => {}) },
  decorators: [(Story) => <div className="bg-white p-6 text-[#18181b]"><button type="button">Before account</button>
    <div className="w-[248px] bg-[#07558f] p-3"><Story /></div><button type="button">After account</button></div>],
} satisfies Meta<typeof AccountButton>
export default meta
type Story = StoryObj<typeof meta>
export const KeyboardNavigation: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Account alex@example.test' })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    const body = within(document.body)
    const first = body.getByRole('menuitem', { name: 'Set password' })
    const last = body.getByRole('menuitem', { name: 'Sign out alex@example.test' })
    await expect(first).toHaveFocus()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowDown}')
    await expect(last).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(first).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expect(last).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(first).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await expect(trigger).toHaveFocus()
    await expect(body.queryByRole('menu')).not.toBeInTheDocument()
    await userEvent.keyboard('{ArrowUp}')
    await expect(body.getByRole('menuitem', { name: 'Sign out alex@example.test' })).toHaveFocus()
  },
}
export const OutsideAndTabDismissal: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Account alex@example.test' })
    const after = canvas.getByRole('button', { name: 'After account' })
    const body = within(document.body)
    await userEvent.click(trigger)
    await userEvent.click(after)
    await expect(body.queryByRole('menu')).not.toBeInTheDocument()
    await expect(after).toHaveFocus()
    await userEvent.click(trigger)
    await userEvent.tab()
    await expect(body.queryByRole('menu')).not.toBeInTheDocument()
    await expect(after).toHaveFocus()
    await userEvent.click(trigger)
    await userEvent.tab({ shift: true })
    await expect(canvas.getByRole('button', { name: 'Before account' })).toHaveFocus()
  },
}
export const PendingSignOutEscape: Story = {
  args: { onSignOut: fn(() => new Promise<void>(() => {})) },
  play: async ({ canvas, userEvent, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Account alex@example.test' })
    const body = within(document.body)
    await userEvent.click(trigger)
    await userEvent.click(body.getByRole('menuitem', { name: 'Sign out alex@example.test' }))
    await expect(body.getByRole('menuitem', { name: 'Signing out alex@example.test' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    await expect(body.queryByRole('menu')).not.toBeInTheDocument()
    await expect(trigger).toHaveFocus()
    await expect(args.onSignOut).toHaveBeenCalledOnce()
  },
}
