import type { StoryObj } from '@storybook/react-vite'
import { expect, spyOn, within } from 'storybook/test'
import boardMeta from './KanbanBoard.stories'
import { remoteBoardChange, setBoardInput } from './board-story-events'

const meta = { ...boardMeta, title: 'Kanban/Board interactions' }
export default meta
type Story = StoryObj<typeof meta>
export const CustomColumnLifecycle: Story = { args: { board: { columns: [], cards: [], comments: [] } },
  play: async ({ canvas, canvasElement, args, userEvent }) => {
    const root = within(canvasElement.ownerDocument.body)
    await expect(canvas.queryByRole('region')).not.toBeInTheDocument()
    for (const title of ['First', 'Second']) {
      await userEvent.click(canvas.getByRole('button', { name: '+ Add another column' }))
      await setBoardInput(canvas.getByRole('textbox', { name: 'Column title' }), title)
      await userEvent.click(canvas.getByRole('button', { name: 'Add column' }))
      await expect(canvas.getByRole('region', { name: title })).toBeVisible()
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Column actions for Second' }))
    await userEvent.click(root.getByRole('button', { name: 'Move column left' }))
    await expect(canvas.getAllByRole('heading').map((heading) => heading.textContent)).toEqual(['Second', 'First'])
    await userEvent.click(canvas.getByRole('button', { name: 'Column actions for Second' }))
    await userEvent.click(root.getByRole('button', { name: 'Rename column' }))
    await setBoardInput(root.getByRole('textbox', { name: 'Title' }), 'Ready')
    await userEvent.click(root.getByRole('button', { name: 'Save' }))
    await expect(canvas.getByRole('region', { name: 'Ready' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Column actions for Ready' }))
    const confirm = spyOn(window, 'confirm').mockReturnValue(true)
    try { await userEvent.click(root.getByRole('button', { name: 'Delete column' })) }
    finally { confirm.mockRestore() }
    await expect(canvas.getAllByRole('heading').map((heading) => heading.textContent)).toEqual(['First'])
    await expect(args.run.mock.calls.map(([command]) => command.type)).toEqual([
      'create-column', 'create-column', 'move-column', 'rename-column', 'delete-column',
    ])
  } }
export const DeletedColumnDraft: Story = { play: async ({ canvas, args, userEvent }) => {
  const todo = within(canvas.getByRole('region', { name: 'Todo' }))
  await userEvent.click(todo.getByRole('button', { name: '+ Add a card' }))
  await setBoardInput(todo.getByRole('textbox'), 'Copy my task')
  await remoteBoardChange({ type: 'delete-column', id: 'todo' })
  await expect(todo.getByRole('textbox')).toHaveValue('Copy my task')
  await expect(todo.getByRole('textbox')).toHaveAttribute('readonly')
  await expect(todo.getByRole('button', { name: 'Add card' })).toBeDisabled()
  await expect(todo.getByRole('alert')).toHaveTextContent('column was deleted elsewhere')
  const confirm = spyOn(window, 'confirm').mockReturnValue(false)
  try {
    await userEvent.click(todo.getByRole('button', { name: 'Cancel' }))
    await expect(todo.getByRole('textbox')).toHaveValue('Copy my task')
    confirm.mockReturnValue(true)
    await userEvent.click(todo.getByRole('button', { name: 'Cancel' }))
    await expect(canvas.queryByRole('region', { name: 'Todo' })).not.toBeInTheDocument()
    await expect(args.run).not.toHaveBeenCalled()
  } finally { confirm.mockRestore() }
} }
export const PendingBoard: Story = { args: { pending: true }, play: async ({ canvas, canvasElement, args, userEvent }) => {
  for (const button of canvasElement.querySelectorAll('.kanban-card, .kanban-add-card, .kanban-add-column > button'))
    await expect(button).toBeDisabled()
  for (const card of canvasElement.querySelectorAll('.kanban-card')) await expect(card).toHaveAttribute('draggable', 'false')
  await userEvent.click(canvas.getByRole('button', { name: 'Column actions for Backlog' }))
  const root = within(canvasElement.ownerDocument.body)
  const panel = root.getByRole('group', { name: 'Column actions for Backlog' })
  for (const button of within(panel).getAllByRole('button')) await expect(button).toBeDisabled()
  await userEvent.keyboard('{Escape}')
  await expect(panel).not.toBeInTheDocument()
  await expect(args.run).not.toHaveBeenCalled()
} }
