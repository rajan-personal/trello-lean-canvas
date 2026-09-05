import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { createBoard } from '../../data/board'
import { BoardStory } from './Board.story-support'
import type { RunBoardCommand } from './board-ui'
import { KanbanBoard } from './KanbanBoard'
import { boardStoryData, boardStoryUser } from './board-story-fixtures'

const meta = {
  title: 'Kanban/Board', component: KanbanBoard, tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <main className="kanban-area" style={{ height: '90vh', background: '#0c66e4' }}><Story /></main>],
  args: { board: boardStoryData, user: boardStoryUser, pending: false, error: null,
    register: () => () => undefined, run: fn<RunBoardCommand>(async () => true) },
  render: (args) => <BoardStory {...args} />,
} satisfies Meta<typeof KanbanBoard>
export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = { play: async ({ canvasElement }) => {
  await expect(canvasElement.querySelectorAll('.kanban-column')).toHaveLength(6)
  await expect(canvasElement.querySelectorAll('.kanban-card')).toHaveLength(3)
  await expect(canvasElement.querySelectorAll('.kanban-card > *')).toHaveLength(0)
  await expect(within(canvasElement).queryByText(boardStoryData.cards[0].description)).not.toBeInTheDocument()
} }
export const Empty: Story = { args: { board: createBoard() }, play: async ({ canvas }) => {
  await expect(canvas.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
    'Backlog', 'Todo', 'In Progress', 'Review', 'Done', 'Closed',
  ])
  await expect(canvas.queryAllByRole('listitem')).toHaveLength(0)
} }
export const EmptyColumnActions: Story = { ...Empty, play: async ({ canvasElement }) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Column actions for Backlog' }))
  const panel = within(canvasElement.ownerDocument.body).getByRole('group', { name: 'Column actions for Backlog' })
  await expect(within(panel).getByRole('button', { name: 'Delete column' })).toBeEnabled()
  await userEvent.keyboard('{Escape}')
} }
export const Saving: Story = { args: { pending: true } }
export const NoColumns: Story = { args: { board: { columns: [], cards: [], comments: [] } } }
export const Mobile: Story = { ...Populated, globals: { viewport: { value: 'mobile1', isRotated: false } } }

export const InlineCardComposer: Story = { ...Populated, play: async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await userEvent.click(canvas.getAllByRole('button', { name: '+ Add a card' })[0])
  await userEvent.type(canvas.getByRole('textbox', { name: 'Card title' }), 'New inline card draft')
  await userEvent.click(canvas.getByRole('button', { name: 'Add card' }))
  await expect(canvas.getByRole('button', { name: 'New inline card draft' })).toBeVisible()
} }
export const InlineColumnComposer: Story = { ...Populated, play: async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await userEvent.click(canvas.getByRole('button', { name: '+ Add another column' }))
  await userEvent.type(canvas.getByRole('textbox', { name: 'Column title' }), 'New inline column draft')
  await userEvent.click(canvas.getByRole('button', { name: 'Add column' }))
  await expect(canvas.getByRole('region', { name: 'New inline column draft' })).toBeVisible()
} }
