import type { StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, spyOn } from 'storybook/test'
import cardMeta from './BoardCardDialog.stories'
import { boardStoryData, boardStoryUser } from './board-story-fixtures'
import { setBoardInput } from './board-story-events'
import { canvasStoryAct } from '../canvas-story-act'

const meta = { ...cardMeta, title: 'Kanban/Card interactions' }
export default meta
type Story = StoryObj<typeof meta>
export const IndependentCommentRetry: Story = {
  beforeEach: ({ args }) => { args.run.mockResolvedValueOnce(false) },
  play: async ({ canvas, args, userEvent }) => {
    await setBoardInput(canvas.getByRole('textbox', { name: 'Title' }), 'Local title draft')
    await setBoardInput(canvas.getByRole('textbox', { name: 'Description' }), 'Local description')
    const input = canvas.getByRole('textbox', { name: 'New comment' })
    await setBoardInput(input, '  A real comment\nWith another line  ')
    await userEvent.click(canvas.getByRole('button', { name: 'Add comment' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('could not be saved')
    await expect(input).toHaveValue('  A real comment\nWith another line  ')
    await userEvent.click(canvas.getByRole('button', { name: 'Add comment' }))
    await expect(input).toHaveValue('')
    await expect(args.run.mock.calls[0]).toEqual(args.run.mock.calls[1])
    await expect(args.run).toHaveBeenLastCalledWith({ type: 'add-comment', comment: {
      id: expect.any(String), cardId: 'plan', authorId: boardStoryUser.uid, authorName: 'Alex Morgan',
      text: 'A real comment\nWith another line', createdAt: expect.stringMatching(/^\d{4}-/) } })
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2)
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toHaveValue('Local title draft')
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toHaveValue('Local description')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(canvas.getByRole('button', { name: 'Local title draft' })).toBeVisible()
    await expect(args.run).toHaveBeenLastCalledWith({ type: 'edit-card', id: 'plan', title: 'Local title draft',
      description: 'Local description', columnId: 'backlog', expected: boardStoryData.cards[0] })
    await userEvent.click(canvas.getByRole('button', { name: 'Local title draft' }))
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toHaveValue('Local description')
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2)
  },
}
export const SaveKeepsUnsentComment: Story = { play: async ({ canvas, args, userEvent }) => {
  const confirm = spyOn(window, 'confirm').mockReturnValue(false)
  try {
    await setBoardInput(canvas.getByRole('textbox', { name: 'New comment' }), 'Unsent discussion')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Card saved.')
    await expect(canvas.getByRole('textbox', { name: 'New comment' })).toHaveValue('Unsent discussion')
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(args.onClose).not.toHaveBeenCalled()
    await expect(confirm).toHaveBeenCalledWith('Discard unsaved changes?')
    confirm.mockReturnValue(true)
    await userEvent.click(canvas.getByRole('button', { name: 'Close dialog' }))
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  } finally { confirm.mockRestore() }
} }
export const TitleValidationAndIme: Story = { play: async ({ canvas, args, userEvent }) => {
  const title = canvas.getByRole('textbox', { name: 'Title' })
  await setBoardInput(title, '   ')
  await userEvent.keyboard('{Enter}')
  await expect(args.run).not.toHaveBeenCalled()
  await setBoardInput(title, 'Composing title')
  await canvasStoryAct(() => { fireEvent.keyDown(title, { key: 'Enter', isComposing: true }) })
  await expect(args.run).not.toHaveBeenCalled()
  await setBoardInput(title, '  First\nSecond  ')
  await expect(title).toHaveValue('  First Second  ')
  await userEvent.keyboard('{Enter}')
  await expect(canvas.getByRole('button', { name: 'First Second' })).toBeVisible()
} }
export const ConfirmDeletion: Story = { play: async ({ canvas, args, userEvent }) => {
  const confirm = spyOn(window, 'confirm').mockReturnValue(false)
  try {
    const remove = canvas.getByRole('button', { name: 'Delete card' })
    await expect(remove.closest('header')).not.toBeNull()
    await userEvent.click(remove)
    await expect(args.run).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    await userEvent.click(remove)
    await expect(canvas.getByText('Card deleted')).toBeVisible()
    await expect(args.run).toHaveBeenCalledWith({ type: 'delete-card', id: 'plan' })
  } finally { confirm.mockRestore() }
} }
