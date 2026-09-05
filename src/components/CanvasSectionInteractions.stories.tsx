import { expect } from 'storybook/test'
import {
  canvasSectionMeta,
  costSection,
  type CanvasSectionStory,
} from './CanvasSection.story-support'
const meta = { ...canvasSectionMeta, title: 'Lean Canvas/CanvasSection' }
export default meta
export const SubmitCard: CanvasSectionStory = {
  args: { addingSectionId: 'problem', cardDraft: 'A concise customer problem' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Add card' }))
    await expect(args.addCard).toHaveBeenCalledWith('problem')
    await expect(canvas.getByRole('button', { name: '＋ Add a card' })).toHaveFocus()
    await expect(
      canvas.getByRole('button', { name: 'A concise customer problem' }),
    ).toBeInTheDocument()
  },
}
export const Editing: CanvasSectionStory = {
  args: {
    editingCard: {
      sectionId: 'problem',
      index: 0,
      value: 'A clearer customer problem',
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('textbox', { name: 'Edit card' }),
    ).toHaveValue('A clearer customer problem')
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeEnabled()
  },
}
export const SaveEdit: CanvasSectionStory = {
  args: {
    editingCard: {
      sectionId: 'problem',
      index: 0,
      value: 'A clearer customer problem',
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(args.saveEditedCard).toHaveBeenCalledOnce()
    await expect(
      canvas.getByRole('button', { name: 'A clearer customer problem' }),
    ).toBeInTheDocument()
  },
}
export const BottomPanel: CanvasSectionStory = {
  args: { bottom: true, section: costSection },
}
