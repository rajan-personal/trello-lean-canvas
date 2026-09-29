import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { within, expect, fn, mocked, waitFor } from 'storybook/test'
import { AccountButton } from './AccountButton'

const meta = {
  title: 'Lean Canvas/AccountActions', component: AccountButton,
  args: { user: { uid: 'synthetic', displayName: 'Synthetic User', email: null, photoURL: null },
    onSignOut: fn(async () => {}) },
  decorators: [(Story) => <div className="w-[248px] bg-[#07558f]"><Story /></div>],
} satisfies Meta<typeof AccountButton>
export default meta
type Story = StoryObj<typeof meta>

export const RejectionAndRetry: Story = {
  play: async ({ args, canvas, userEvent }) => {
    let reject!: (error: Error) => void
    mocked(args.onSignOut).mockImplementationOnce(() => new Promise<void>((_, fail) => { reject = fail }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Account Synthetic User' }))
    await userEvent.click(within(document.body).getByRole('menuitem', { name: 'Sign out Synthetic User' }))
    const pending = within(document.body).getByRole('menuitem', { name: 'Signing out Synthetic User' })
    await expect(pending).toBeDisabled()
    await expect(pending).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(pending)
    await expect(args.onSignOut).toHaveBeenCalledOnce()
    reject(new Error('Synthetic rejection'))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Sign out failed. Please try again.')
    await waitFor(() => expect(within(document.body).getByRole('menuitem', { name: 'Sign out Synthetic User' })).toBeEnabled())
    await userEvent.click(within(document.body).getByRole('menuitem', { name: 'Sign out Synthetic User' }))
    await expect(args.onSignOut).toHaveBeenCalledTimes(2)
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}

export const RejectionAfterUnmount: Story = {
  render: function Fixture(args) {
    const [mounted, setMounted] = useState(true)
    return <><button className="bg-white" onClick={() => setMounted((value) => !value)}>Toggle account</button>
      {mounted && <AccountButton {...args} />}</>
  },
  play: async ({ args, canvas, userEvent }) => {
    let reject!: (error: Error) => void
    mocked(args.onSignOut).mockImplementationOnce(() => new Promise<void>((_, fail) => { reject = fail }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Account Synthetic User' }))
    await userEvent.click(within(document.body).getByRole('menuitem', { name: 'Sign out Synthetic User' }))
    await expect(within(document.body).getByRole('menuitem', { name: 'Signing out Synthetic User' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle account' }))
    reject(new Error('Synthetic late rejection'))
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle account' }))
    await expect(canvas.getByRole('button', { name: 'Account Synthetic User' })).toBeEnabled()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    await expect(args.onSignOut).toHaveBeenCalledOnce()
  },
}
