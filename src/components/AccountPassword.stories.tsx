import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { AccountButton } from './AccountButton'

const meta = {
  title: 'Lean Canvas/Account password', component: AccountButton,
  parameters: { layout: 'centered' },
  args: { user: { uid: 'synthetic-account', displayName: 'Alex Morgan', email: 'alex@example.test', photoURL: null },
    onSignOut: fn(), onSetPassword: fn<(password: string) => Promise<void>>(async () => {}) },
  decorators: [(Story) => <div className="w-[248px] bg-[#07558f] p-3"><Story /></div>],
} satisfies Meta<typeof AccountButton>
export default meta
type Story = StoryObj<typeof meta>
export const SetThenChange: Story = {
  render: function Account(args) {
    const [hasPassword, setHasPassword] = useState(false)
    return <AccountButton {...args} user={{ ...args.user, hasPassword }} onSetPassword={async (password) => {
      await args.onSetPassword?.(password)
      setHasPassword(true)
    }} />
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Set password' }))
    const modal = within(await within(document.body).findByRole('dialog'))
    await userEvent.type(modal.getByLabelText('New password'), 'example-password')
    await userEvent.type(modal.getByLabelText('Confirm password'), 'example-password')
    await userEvent.click(modal.getByRole('button', { name: 'Verify with Google and save' }))
    await userEvent.click(await modal.findByRole('button', { name: 'Done' }))
    await expect(args.onSetPassword).toHaveBeenCalledWith('example-password')
    await userEvent.click(canvas.getByRole('button', { name: 'Change password' }))
    await expect(within(document.body).getByRole('heading', { name: 'Change password' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByRole('button', { name: 'Change password' })).toHaveFocus()
  },
}
