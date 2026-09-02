import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor } from 'storybook/test'
import { Sidebar } from './Sidebar'
import { favoriteCanvas, storyCanvas } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-dvh min-h-[640px] bg-[#0c66e4] text-white">
        <Story />
      </div>
    ),
  ],
  args: {
    canvases: [storyCanvas, favoriteCanvas],
    activeId: storyCanvas.id,
    onSelect: fn(),
    onMove: fn(),
    user: {
      uid: 'storybook-user',
      displayName: 'Storybook User',
      email: 'storybook@example.com',
      photoURL: null,
    },
    onSignOut: fn(),
    open: false,
    collapsed: false,
    onClose: fn(),
  },
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Team alignment' }))
    await expect(args.onSelect).toHaveBeenCalledWith(storyCanvas.id)
    await expect(args.onClose).toHaveBeenCalledOnce()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Sign out storybook@example.com' }),
    )
    await expect(args.onSignOut).toHaveBeenCalledOnce()
  },
}

export const Collapsed: Story = {
  args: { collapsed: true },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        canvasElement.querySelector('#canvas-sidebar')?.getBoundingClientRect()
          .width,
      ).toBe(0),
    )
  },
}

export const MobileOpen: Story = {
  args: { open: true },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ args, canvas, userEvent }) => {
    const closeButtons = canvas.getAllByRole('button', { name: 'Close sidebar' })
    await userEvent.click(closeButtons.at(-1)!)
    await expect(args.onClose).toHaveBeenCalled()
  },
}

export const Empty: Story = {
  args: { canvases: [], activeId: null },
}
