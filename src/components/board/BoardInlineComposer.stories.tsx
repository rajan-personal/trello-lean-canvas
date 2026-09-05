import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, spyOn } from 'storybook/test'
import { BoardInlineComposer } from './BoardInlineComposer'
import { InlineComposerStory } from './BoardEditors.story-support'
import { setBoardInput, submitBoardForm } from './board-story-events'
import './kanban.css'

const meta = {
  decorators: [(Story) => <div style={{ background: 'white', color: '#172b4d', padding: 16 }}><Story /></div>],
  title: 'Kanban/Inline composer', component: BoardInlineComposer,
  args: { kind: 'card', pending: false, error: null, register: () => () => undefined,
    onSave: fn(async () => true), onClose: fn() },
  render: (args) => <InlineComposerStory {...args} />,
} satisfies Meta<typeof BoardInlineComposer>
export default meta
type Story = StoryObj<typeof meta>

export const CardRetry: Story = {
  beforeEach: ({ args }) => { args.onSave.mockResolvedValueOnce(false) },
  play: async ({ canvas, args, userEvent }) => {
    const title = canvas.getByRole('textbox', { name: 'Card title' }) as HTMLTextAreaElement
    await expect(title).toHaveFocus()
    await setBoardInput(title, '   ')
    await submitBoardForm(title.form!)
    await expect(args.onSave).not.toHaveBeenCalled()
    await setBoardInput(title, '  Retry this card  ')
    await userEvent.click(canvas.getByRole('button', { name: 'Add card' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('Save failed')
    await expect(title).toHaveValue('  Retry this card  ')
    await userEvent.click(canvas.getByRole('button', { name: 'Add card' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Retry this card')
    await expect(args.onSave).toHaveBeenCalledTimes(2)
    await expect(args.onSave.mock.calls[0]).toEqual(args.onSave.mock.calls[1])
    await expect(args.onSave).toHaveBeenLastCalledWith(expect.any(String), 'Retry this card')
  },
}
export const ColumnRetry: Story = { ...CardRetry, args: { kind: 'column' }, play: async ({ canvas, args, userEvent }) => {
  await userEvent.type(canvas.getByRole('textbox'), 'Custom column')
  await userEvent.click(canvas.getByRole('button', { name: 'Add column' }))
  await expect(canvas.getByRole('alert')).toHaveTextContent('Save failed')
  await userEvent.click(canvas.getByRole('button', { name: 'Add column' }))
  await expect(canvas.getByRole('status')).toHaveTextContent('Custom column')
  await expect(args.onSave.mock.calls[0]).toEqual(args.onSave.mock.calls[1])
} }
export const GuardedEscape: Story = { play: async ({ canvas, args, userEvent }) => {
  const confirm = spyOn(window, 'confirm').mockReturnValue(false)
  try {
    await userEvent.type(canvas.getByRole('textbox'), 'Retained draft')
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByRole('textbox')).toHaveValue('Retained draft')
    await expect(args.onClose).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Composer closed')
  } finally { confirm.mockRestore() }
} }
export const Pending: Story = { args: { pending: true }, play: async ({ canvas, args }) => {
  await expect(canvas.getByRole('textbox')).toBeDisabled()
  for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled()
  await submitBoardForm(canvas.getByRole('form') as HTMLFormElement)
  await expect(args.onSave).not.toHaveBeenCalled()
} }
export const RemoteDeleted: Story = { args: { deleted: true, error: 'This column was deleted elsewhere.' },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('textbox')).toHaveAttribute('readonly')
    await expect(canvas.getByRole('button', { name: 'Add card' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    await submitBoardForm(canvas.getByRole('form') as HTMLFormElement)
    await expect(args.onSave).not.toHaveBeenCalled()
  } }
