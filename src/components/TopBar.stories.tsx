import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { TopBar } from './TopBar'
import { favoriteCanvas, storyCanvas } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    canvas: storyCanvas,
    sidebarOpen: false,
    sidebarCollapsed: false,
    notepadOpen: false,
    onToggleSidebar: fn(),
    onOpenSidebar: fn(),
    onNewCanvas: fn(),
    onRename: fn(),
    onFavorite: fn(),
    onToggleNotepad: fn(),
    onDelete: fn(),
    onImport: fn(),
    onNotify: fn(),
    user: {
      uid: 'storybook-user',
      displayName: 'Storybook User',
      email: 'storybook@example.com',
      photoURL: null,
    },
    onSignOut: fn(),
  },
} satisfies Meta<typeof TopBar>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Add canvas' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Notepad' }))
    await expect(args.onToggleSidebar).toHaveBeenCalledOnce()
    await expect(args.onNewCanvas).toHaveBeenCalledOnce()
    await expect(args.onToggleNotepad).toHaveBeenCalledOnce()
  },
}

export const ActiveTools: Story = {
  args: {
    canvas: favoriteCanvas,
    notepadOpen: true,
    sidebarCollapsed: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Expand sidebar' }))
      .toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Notepad' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  },
}

export const NoCanvas: Story = {
  args: { canvas: undefined },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Upload another canvas from YAML' }),
    ).toBeInTheDocument()
    await expect(canvas.queryByRole('heading')).not.toBeInTheDocument()
  },
}

export const Mobile: Story = {
  args: { sidebarOpen: true },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Open sidebar' }))
      .toBeVisible()
  },
}
