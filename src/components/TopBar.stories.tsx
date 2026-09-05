import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { TopBar } from './TopBar'
import { favoriteCanvas, storyCanvas } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <>
        <Story />
        <aside id="canvas-sidebar" hidden />
        <aside id="canvas-notepad" hidden />
      </>
    ),
  ],
  args: {
    canvas: storyCanvas,
    sidebarOpen: false,
    sidebarCollapsed: false,
    notepadOpen: false,
    onToggleSidebar: fn(),
    onOpenSidebar: fn(),
    onNewCanvas: fn(),
    onLoadSamples: fn(),
    onRename: fn(),
    onFavorite: fn(),
    onToggleNotepad: fn(),
    onDelete: fn(),
    onImport: fn(),
    onDownload: fn(),
  },
} satisfies Meta<typeof TopBar>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Add canvas' }))
    await userEvent.click(
      canvas.getByRole('button', { name: /^New$/ }),
    )
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
    const favorite = canvas.getByRole('button', { name: 'Favorite canvas' })
    const notepad = canvas.getByRole('button', { name: 'Notepad' })
    await expect(canvas.getByRole('button', { name: 'Expand sidebar' }))
      .toBeInTheDocument()
    await expect(notepad).toHaveAttribute('aria-expanded', 'true')
    await expect(getComputedStyle(favorite).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    )
    await expect(getComputedStyle(notepad).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
  },
}

export const NoCanvas: Story = {
  args: { canvas: undefined },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add canvas' }))
    await expect(canvas.getByRole('button', { name: 'Upload' }))
      .toBeInTheDocument()
    await expect(canvas.queryByRole('heading')).not.toBeInTheDocument()
  },
}

export const Mobile: Story = {
  args: { sidebarOpen: true },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas }) => {
    const menu = canvas.getByRole('button', { name: 'Open sidebar' })
    const add = canvas.getByRole('button', { name: 'Add canvas' })
    await expect(menu).toBeVisible()
    await expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(
      add.getBoundingClientRect().left,
    )
    await expect(canvas.queryByText('Lean', { exact: true }))
      .not.toBeInTheDocument()
  },
}
