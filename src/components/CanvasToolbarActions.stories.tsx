import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { CanvasToolbarActions } from './CanvasToolbarActions'
import { favoriteCanvas, storyCanvas } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/CanvasToolbarActions',
  component: CanvasToolbarActions,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="flex h-12 items-center rounded-md bg-[#0b4a6f] px-2 text-white">
        <Story />
        <div id="canvas-notepad" hidden />
      </div>
    ),
  ],
  args: {
    canvas: storyCanvas,
    notepadOpen: false,
    onFavorite: fn(),
    onToggleNotepad: fn(),
    onDelete: fn(),
    onNotify: fn(),
  },
} satisfies Meta<typeof CanvasToolbarActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Favorite canvas' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Notepad' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Delete board' }))
    await expect(args.onFavorite).toHaveBeenCalledOnce()
    await expect(args.onToggleNotepad).toHaveBeenCalledOnce()
    await expect(args.onDelete).toHaveBeenCalledOnce()
  },
}

export const ActiveStates: Story = {
  args: { canvas: favoriteCanvas, notepadOpen: true },
  play: async ({ canvas }) => {
    const favorite = canvas.getByRole('button', { name: 'Favorite canvas' })
    const notepad = canvas.getByRole('button', { name: 'Notepad' })
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
    await expect(notepad).toHaveAttribute('aria-expanded', 'true')
    await expect(getComputedStyle(favorite).color).toBe('rgb(245, 205, 71)')
    await expect(getComputedStyle(favorite).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    )
    await expect(getComputedStyle(notepad).color).toBe('rgb(245, 205, 71)')
    await expect(getComputedStyle(notepad).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
  },
}
