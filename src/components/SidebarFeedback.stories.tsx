import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, mocked, waitFor } from 'storybook/test'
import { SidebarHarness } from './Sidebar.story-support'
import { storyCanvas } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/Sidebar', component: SidebarHarness,
  decorators: [(Story) => <div className="h-dvh bg-[#07558f] text-white"><Story /></div>],
  args: {
    canvases: [storyCanvas], activeId: storyCanvas.id, open: false, collapsed: false,
    user: { uid: 'sidebar-reviewer', displayName: 'Sidebar reviewer', email: 'reviewer@example.test', photoURL: null },
    onSelect: fn(), onMove: fn(), onClose: fn(), onSignOut: fn(),
  },
} satisfies Meta<typeof SidebarHarness>
export default meta
type Story = StoryObj<typeof meta>

export const PendingFailureAndRetry: Story = {
  play: async ({ args, canvas, userEvent }) => {
    let reject!: (error: Error) => void
    mocked(args.onSignOut).mockImplementationOnce(() => new Promise<void>((_, fail) => { reject = fail }))
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out reviewer@example.test' }))
    const pending = canvas.getByRole('button', { name: 'Signing out reviewer@example.test' })
    await expect(pending).toBeDisabled()
    await expect(pending).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(pending)
    await expect(args.onSignOut).toHaveBeenCalledOnce()
    reject(new Error('Local sign-out failure'))
    await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible())
    await expect(canvas.getByRole('button', { name: 'Team alignment' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out reviewer@example.test' }))
    await expect(await canvas.findByText('Signed out')).toBeVisible()
    await expect(canvas.queryByRole('navigation')).not.toBeInTheDocument()
  },
}
