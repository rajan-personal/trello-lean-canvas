import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, spyOn } from 'storybook/test'
import { BoardTitleDialog } from './BoardTitleDialog'
import { TitleDialogStory } from './BoardEditors.story-support'
import { setBoardInput, submitBoardForm } from './board-story-events'
import './kanban.css'

const meta = {
  decorators: [(Story) => <div style={{ background: 'white', color: '#172b4d', padding: 16 }}><Story /></div>],
  title: 'Kanban/Title dialog', component: BoardTitleDialog,
  args: { heading: 'Rename column', initial: 'Backlog', pending: false, error: null,
    onSave: fn(async () => true), onClose: fn(), register: () => () => undefined },
  render: (args) => <TitleDialogStory {...args} />,
} satisfies Meta<typeof BoardTitleDialog>
export default meta
type Story = StoryObj<typeof meta>

export const RenameRetry: Story = {
  beforeEach: ({ args }) => { args.onSave.mockResolvedValueOnce(false) },
  play: async ({ canvas, args, userEvent }) => {
    const title = canvas.getByRole('textbox') as HTMLInputElement
    await expect(title).toHaveFocus()
    await setBoardInput(title, '   ')
    await submitBoardForm(title.form!)
    await expect(args.onSave).not.toHaveBeenCalled()
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeDisabled()
    await setBoardInput(title, '  Ready  ')
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('alert')).toHaveTextContent('Rename failed')
    await expect(title).toHaveValue('  Ready  ')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(canvas.getByRole('button', { name: 'Ready' })).toBeVisible()
    await expect(args.onSave).toHaveBeenLastCalledWith('Ready')
  },
}
export const GuardedClose: Story = { play: async ({ canvas, args, userEvent }) => {
  const confirm = spyOn(window, 'confirm').mockReturnValue(false)
  try {
    await setBoardInput(canvas.getByRole('textbox'), 'Keep this rename')
    await userEvent.click(canvas.getByRole('button', { name: 'Close dialog' }))
    await expect(canvas.getByRole('textbox')).toHaveValue('Keep this rename')
    await expect(args.onClose).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(canvas.getByRole('button', { name: 'Backlog' })).toBeVisible()
  } finally { confirm.mockRestore() }
} }
export const Pending: Story = { args: { pending: true }, play: async ({ canvas, args, userEvent }) => {
  const title = canvas.getByRole('textbox') as HTMLInputElement
  await expect(title).toBeDisabled()
  await submitBoardForm(title.form!)
  await userEvent.click(canvas.getByRole('button', { name: 'Close dialog' }))
  await expect(args.onSave).not.toHaveBeenCalled()
  await expect(args.onClose).not.toHaveBeenCalled()
} }
export const DeletedColumn: Story = { args: { missing: true }, play: async ({ canvas, args }) => {
  const title = canvas.getByRole('textbox') as HTMLInputElement
  await expect(title).toHaveValue('Backlog')
  await expect(title).toHaveAttribute('readonly')
  await expect(canvas.getByRole('alert')).toHaveTextContent('column was deleted elsewhere')
  await submitBoardForm(title.form!)
  await expect(args.onSave).not.toHaveBeenCalled()
} }
