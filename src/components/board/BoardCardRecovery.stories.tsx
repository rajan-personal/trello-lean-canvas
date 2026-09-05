import type { StoryObj } from '@storybook/react-vite'
import { expect, spyOn } from 'storybook/test'
import cardMeta from './BoardCardDialog.stories'
import { boardStoryData } from './board-story-fixtures'
import { remoteBoardChange, setBoardInput, submitBoardForm } from './board-story-events'
import { canvasStoryAct } from '../canvas-story-act'

const meta = { ...cardMeta, title: 'Kanban/Card recovery' }
export default meta
type Story = StoryObj<typeof meta>
export const FailedSaveRetainsDraft: Story = {
  beforeEach: ({ args }) => { args.run.mockResolvedValueOnce(false) },
  play: async ({ canvas, args, userEvent }) => {
    await setBoardInput(canvas.getByRole('textbox', { name: 'Description' }), 'Keep my work')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('could not be saved')
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toHaveValue('Keep my work')
    await expect(args.onClose).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await userEvent.click(canvas.getByRole('button', { name: boardStoryData.cards[0].title }))
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toHaveValue('Keep my work')
  },
}
export const RemoteConflict: Story = { play: async ({ canvas, args, userEvent }) => {
  await setBoardInput(canvas.getByRole('textbox', { name: 'Description' }), 'Local draft')
  await remoteBoardChange({ type: 'edit-card', id: 'plan', title: 'Remote title', description: 'Remote description',
    columnId: 'backlog', expected: boardStoryData.cards[0] })
  await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
  await expect(canvas.getByRole('status')).toHaveTextContent('changed elsewhere')
  await expect(canvas.getByRole('textbox', { name: 'Description' })).toHaveValue('Local draft')
  await expect(args.run).not.toHaveBeenCalled()
  const confirm = spyOn(window, 'confirm').mockReturnValue(true)
  try {
    await userEvent.click(canvas.getByRole('button', { name: 'Close dialog' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Remote title' }))
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toHaveValue('Remote description')
  } finally { confirm.mockRestore() }
} }
export const RemoteCardDeletion: Story = { play: async ({ canvas, args, userEvent }) => {
  await setBoardInput(canvas.getByRole('textbox', { name: 'Description' }), 'Description to copy')
  await setBoardInput(canvas.getByRole('textbox', { name: 'New comment' }), 'Comment to copy')
  await remoteBoardChange({ type: 'delete-card', id: 'plan' })
  await expect(canvas.getByRole('alert')).toHaveTextContent('card was deleted elsewhere')
  for (const input of canvas.getAllByRole('textbox')) await expect(input).toHaveAttribute('readonly')
  for (const name of ['Save', 'Delete card', 'Add comment'])
    await expect(canvas.getByRole('button', { name })).toBeDisabled()
  for (const form of canvas.getByRole('dialog').querySelectorAll('form')) await submitBoardForm(form)
  await expect(args.run).not.toHaveBeenCalled()
  const confirm = spyOn(window, 'confirm').mockReturnValue(false)
  try {
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toHaveValue('Description to copy')
    await expect(canvas.getByRole('textbox', { name: 'New comment' })).toHaveValue('Comment to copy')
  } finally { confirm.mockRestore() }
} }
export const PendingSaveAndDelayedConflict: Story = { play: async ({ canvas, args, userEvent }) => {
  let finish: (saved: boolean) => void = () => undefined
  args.run.mockImplementationOnce(() => new Promise<boolean>((resolve) => { finish = resolve }))
  try {
    await setBoardInput(canvas.getByRole('textbox', { name: 'Description' }), 'Pending local draft')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Saving changes')
    for (const input of canvas.getAllByRole('textbox')) await expect(input).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Close dialog' }))
    await expect(args.onClose).not.toHaveBeenCalled()
    await expect(args.run).toHaveBeenCalledOnce()
    await remoteBoardChange({ type: 'edit-card', id: 'plan', title: 'Remote title', description: 'Remote description',
      columnId: 'backlog', expected: boardStoryData.cards[0] })
    await canvasStoryAct(async () => { finish(true) })
    await expect(canvas.getByRole('alert')).toHaveTextContent('changed elsewhere')
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toHaveValue('Pending local draft')
    await expect(canvas.getByRole('textbox', { name: 'Description' })).toBeEnabled()
    await expect(args.run).toHaveBeenCalledOnce()
  } finally { await canvasStoryAct(async () => { finish(false) }) }
} }
