import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { BoardColumnMenu } from './BoardColumnMenu'
import './kanban.css'

const meta = {
  decorators: [(Story) => <div style={{ background: 'white', color: '#172b4d', padding: 16 }}><Story /></div>],
  title: 'Kanban/Column actions', component: BoardColumnMenu,
  args: { column: { id: 'custom', title: 'Custom' }, index: 0, count: 2,
    empty: false, pending: false, rename: fn(), run: fn(async () => true) },
  render: (args) => <div style={{ height: 48, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
    <BoardColumnMenu {...args} /><button>Next control</button></div>,
} satisfies Meta<typeof BoardColumnMenu>
export default meta
type Story = StoryObj<typeof meta>
export const FloatingActions: Story = { play: async ({ canvas, canvasElement, args, userEvent }) => {
  await canvasElement.ownerDocument.fonts.ready
  const root = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Column actions for Custom' })
  const before = trigger.getBoundingClientRect().toJSON()
  await userEvent.click(trigger)
  const panel = root.getByRole('group', { name: 'Column actions for Custom' })
  await expect(trigger.getBoundingClientRect().toJSON()).toEqual(before)
  await expect(panel.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth - 8)
  await expect(within(panel).getByRole('button', { name: 'Rename column' })).toHaveFocus()
  await expect(within(panel).getByRole('button', { name: 'Move column left' })).toBeDisabled()
  await expect(within(panel).getByRole('button', { name: 'Delete column' })).toBeDisabled()
  await userEvent.tab({ shift: true })
  await expect(trigger).toHaveFocus()
  await expect(panel).not.toBeInTheDocument()
  await userEvent.click(trigger)
  await userEvent.click(root.getByRole('button', { name: 'Move column right' }))
  await expect(args.run).toHaveBeenCalledWith({ type: 'move-column', id: 'custom', index: 1 })
  await expect(trigger).toHaveFocus()
  await expect(root.queryByRole('group')).not.toBeInTheDocument()
} }
export const AllActionsDisabled: Story = { args: { pending: true }, play: async ({ canvas, canvasElement, args, userEvent }) => {
  const root = within(canvasElement.ownerDocument.body)
  const trigger = canvas.getByRole('button', { name: 'Column actions for Custom' })
  await userEvent.click(trigger)
  const panel = root.getByRole('group', { name: 'Column actions for Custom' })
  for (const button of within(panel).getAllByRole('button')) await expect(button).toBeDisabled()
  await userEvent.tab()
  await expect(panel).not.toBeInTheDocument()
  await expect(canvas.getByRole('button', { name: 'Next control' })).toHaveFocus()
  await expect(args.run).not.toHaveBeenCalled()
} }
