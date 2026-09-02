import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { SidebarCanvasItem } from './SidebarCanvasItem'
import { favoriteCanvas, storyCanvas } from './component-story-fixtures'

const meta = {
  title: 'Lean Canvas/SidebarCanvasItem',
  component: SidebarCanvasItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[248px] bg-[#07558f] p-2.5 text-white"><Story /></div>
    ),
  ],
  args: {
    canvas: storyCanvas,
    index: 1,
    activeId: null,
    draggedId: null,
    dropTarget: null,
    onSelect: fn(),
    onMove: fn(),
    onDrag: fn(),
    onTarget: fn(),
    onDrop: fn(),
  },
} satisfies Meta<typeof SidebarCanvasItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const item = canvas.getByRole('button', { name: 'Team alignment' })
    await userEvent.click(item)
    await expect(args.onSelect).toHaveBeenCalledWith('story-canvas')
    item.focus()
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await expect(args.onMove).toHaveBeenCalledWith('story-canvas', 2)
  },
}

export const ActiveFavorite: Story = {
  args: { canvas: favoriteCanvas, activeId: favoriteCanvas.id },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.canvas-nav-favorite'))
      .toBeInTheDocument()
  },
}

export const Dragged: Story = {
  args: { draggedId: storyCanvas.id },
}

export const DropBefore: Story = {
  args: {
    draggedId: 'another-canvas',
    dropTarget: { canvasId: storyCanvas.id, edge: 'before' },
  },
}

export const DropAfter: Story = {
  args: {
    draggedId: 'another-canvas',
    dropTarget: { canvasId: storyCanvas.id, edge: 'after' },
  },
}
