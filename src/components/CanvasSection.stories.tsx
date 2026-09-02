import { expect } from 'storybook/test'
import {
  canvasSectionMeta,
  defaultDragHandlers,
  problemSection,
  type CanvasSectionStory,
} from './CanvasSection.story-support'
const meta = { ...canvasSectionMeta, title: 'Lean Canvas/CanvasSection' }
export default meta
export const Populated: CanvasSectionStory = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getAllByTitle('Double-click to edit; drag to move'),
    ).toHaveLength(3)
    await expect(canvas.getByText('Problem')).toBeInTheDocument()
    await expect(canvas.queryByText('1.')).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: 'Clear Problem' }),
    ).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '＋ Add a card' }))
    await expect(args.startAddingCard).toHaveBeenCalledWith('problem')
  },
}
export const DraggingDown: CanvasSectionStory = {
  args: {
    dragHandlers: {
      ...defaultDragHandlers,
      draggedCard: { sectionId: 'problem', index: 0, height: 42 },
      dropTarget: { sectionId: 'problem', index: 3 },
    },
  },
  play: async ({ canvasElement }) => {
    const slots = canvasElement.querySelectorAll<HTMLElement>(
      '.canvas-card-drop-slot',
    )
    await expect(slots).toHaveLength(3)
    await expect(slots[0]).toHaveStyle({ opacity: '0.35' })
    await expect(slots[1].style.transform).toBe(
      'translate3d(0px, -48px, 0px)',
    )
    await expect(slots[2].style.transform).toBe(
      'translate3d(0px, -48px, 0px)',
    )
    await expect(
      canvasElement.querySelector('[class*="before:bg-[#0c66e4]"]'),
    ).toBeNull()
  },
}
export const Empty: CanvasSectionStory = {
  args: { section: { ...problemSection, cards: [] } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('List your top 1–3 problems.'),
    ).toBeInTheDocument()
  },
}
export const Composing: CanvasSectionStory = {
  args: { addingSectionId: 'problem', cardDraft: 'A concise customer problem' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'New card' })).toHaveValue(
      'A concise customer problem',
    )
    await expect(canvas.getByRole('button', { name: 'Add card' })).toHaveStyle({
      minHeight: '28px',
      fontSize: '12px',
    })
  },
}
