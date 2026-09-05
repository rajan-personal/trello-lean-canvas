import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent, within } from 'storybook/test'
import { createBoard } from '../../data/board'
import { applyBoardCommand } from '../../data/board-mutations'
import { KanbanBoard } from './KanbanBoard'
import { boardStoryData, boardStoryUser } from './board-story-fixtures'

const meta = {
  title: 'Kanban/Board', component: KanbanBoard, tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <main className="kanban-area" style={{ height: '90vh', background: '#0c66e4' }}><Story /></main>],
  args: { board: boardStoryData, user: boardStoryUser, pending: false, error: null,
    register: () => () => undefined, run: fn(async () => true) },
} satisfies Meta<typeof KanbanBoard>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {
  render: function Interactive(args) {
    const [board, setBoard] = useState(args.board)
    return <KanbanBoard {...args} board={board} run={async (command) => {
      setBoard((current) => applyBoardCommand(current, command))
      return true
    }} />
  },
}
export const Empty: Story = { args: { board: createBoard() } }
export const EmptyColumnActions: Story = { ...Empty, play: async ({ canvasElement }) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Column actions for Backlog' }))
} }
export const Saving: Story = { args: { pending: true } }
export const NoColumns: Story = { args: { board: { columns: [], cards: [], comments: [] } } }
export const Mobile: Story = { ...Populated, globals: { viewport: { value: 'mobile1', isRotated: false } } }

export const InlineCardComposer: Story = { ...Populated, play: async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await userEvent.click(canvas.getAllByRole('button', { name: '+ Add a card' })[0])
  await userEvent.type(canvas.getByRole('textbox', { name: 'Card title' }), 'New inline card draft')
} }
export const InlineColumnComposer: Story = { ...Populated, play: async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await userEvent.click(canvas.getByRole('button', { name: '+ Add another column' }))
  await userEvent.type(canvas.getByRole('textbox', { name: 'Column title' }), 'New inline column draft')
} }
