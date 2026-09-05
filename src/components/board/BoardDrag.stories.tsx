import type { StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import boardMeta from './KanbanBoard.stories'
import { dragBoardCard } from './board-story-events'

const meta = { ...boardMeta, title: 'Kanban/Drag ordering' }
export default meta
type Story = StoryObj<typeof meta>
export const InsertBeforeAndAfter: Story = { play: async ({ canvas, args }) => {
  const backlog = within(canvas.getByRole('region', { name: 'Backlog' }))
  const plan = canvas.getByRole('button', { name: 'Outline the launch plan' })
  const research = canvas.getByRole('button', { name: 'Talk to three early customers' })
  const prototype = canvas.getByRole('button', { name: 'Build a focused prototype' })
  const titles = () => backlog.getAllByRole('listitem').map((item) => item.textContent)
  await dragBoardCard(plan, plan)
  await expect(args.run).not.toHaveBeenCalled()
  await dragBoardCard(prototype, plan, true)
  await expect(titles()).toEqual(['Outline the launch plan', 'Build a focused prototype', 'Talk to three early customers'])
  await expect(args.run).toHaveBeenLastCalledWith({ type: 'move-card', id: 'prototype', columnId: 'backlog', index: 1 })
  await dragBoardCard(research, backlog.getByRole('button', { name: 'Build a focused prototype' }))
  await expect(titles()).toEqual(['Outline the launch plan', 'Talk to three early customers', 'Build a focused prototype'])
  await expect(args.run).toHaveBeenLastCalledWith({ type: 'move-card', id: 'research', columnId: 'backlog', index: 1 })
  await dragBoardCard(plan, canvas.getByRole('region', { name: 'Todo' }))
  await expect(within(canvas.getByRole('region', { name: 'Todo' })).getByRole('button', { name: 'Outline the launch plan' })).toBeVisible()
  await expect(args.run).toHaveBeenLastCalledWith({ type: 'move-card', id: 'plan', columnId: 'todo', index: 0 })
} }
export const PendingDragRejected: Story = { args: { pending: true }, play: async ({ canvas, args }) => {
  await dragBoardCard(canvas.getByRole('button', { name: 'Outline the launch plan' }), canvas.getByRole('region', { name: 'Todo' }))
  await expect(args.run).not.toHaveBeenCalled()
  await expect(within(canvas.getByRole('region', { name: 'Backlog' })).getAllByRole('listitem')).toHaveLength(2)
} }
