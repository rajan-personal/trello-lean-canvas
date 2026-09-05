import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { KanbanColumn } from './KanbanColumn'
import { ColumnStory } from './KanbanColumn.story-support'
import { boardStoryData } from './board-story-fixtures'
import { setBoardInput } from './board-story-events'
import './kanban.css'

const meta = {
  title: 'Kanban/Column', component: KanbanColumn,
  args: { column: boardStoryData.columns[0], cards: [], index: 0, count: 1, pending: false,
    error: null, register: () => () => undefined, adding: false, onAddingChange: fn(),
    run: fn(async () => true), onOpen: fn(), onRename: fn(),
    drag: { target: null, start: fn(), end: fn(), over: fn(), drop: fn() } },
  render: (args) => <ColumnStory {...args} />,
} satisfies Meta<typeof KanbanColumn>
export default meta
type Story = StoryObj<typeof meta>
export const EmptyToPopulated: Story = { play: async ({ canvas, args, userEvent }) => {
  await expect(canvas.getByLabelText('0 cards')).toBeVisible()
  await userEvent.click(canvas.getByRole('button', { name: '+ Add a card' }))
  await setBoardInput(canvas.getByRole('textbox', { name: 'Card title' }), 'Standalone task')
  await userEvent.click(canvas.getByRole('button', { name: 'Add card' }))
  await expect(canvas.getByLabelText('1 card')).toBeVisible()
  await expect(canvas.getByRole('button', { name: '+ Add a card' })).toHaveFocus()
  await userEvent.click(canvas.getByRole('button', { name: 'Standalone task' }))
  await expect(args.onOpen).toHaveBeenCalledWith(expect.objectContaining({ title: 'Standalone task', columnId: 'backlog' }))
  await expect(args.run).toHaveBeenCalledWith({ type: 'create-card', id: expect.any(String), title: 'Standalone task', columnId: 'backlog' })
} }
export const LongTitleOnly: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { cards: [{ ...boardStoryData.cards[0], title: 'Unbroken'.repeat(60) }] },
  play: async ({ canvas, canvasElement }) => {
    const card = canvas.getByRole('button', { name: 'Unbroken'.repeat(60) })
    await expect(card.children).toHaveLength(0)
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth)
    await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBe(window.innerWidth)
  } }
