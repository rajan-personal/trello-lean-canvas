import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { BoardScreenFixture } from './WorkspaceBoard.story-support'
import { boardStoryData, boardStoryUser } from '../components/board/board-story-fixtures'

const meta = {
  title: 'Screens/WorkspaceBoard', component: BoardScreenFixture,
  parameters: { layout: 'fullscreen' },
  args: { user: boardStoryUser, blocked: false, notify: fn(), onDismissDeleted: fn(), register: () => () => {},
    state: { board: boardStoryData, loading: false, pending: false, error: null,
      reload: fn(async () => {}), dispatch: fn(async () => {}) } },
} satisfies Meta<typeof BoardScreenFixture>
export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { state: { ...meta.args.state, board: undefined, loading: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading board…')
    await expect(canvas.queryByRole('button', { name: '+ Add another column' })).not.toBeInTheDocument()
  },
}
export const Retry: Story = {
  args: { state: { ...meta.args.state, board: undefined, error: 'Synthetic load failure' } },
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Synthetic load failure')
    await userEvent.click(canvas.getByRole('button', { name: 'Retry loading board' }))
    await expect(args.state.reload).toHaveBeenCalledOnce()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    await expect(await canvas.findByRole('button', { name: 'Outline the launch plan' })).toBeVisible()
  },
}
export const Saving: Story = {
  args: { state: { ...meta.args.state, pending: true } },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Saving board…')
    const add = canvas.getByRole('button', { name: '+ Add another column' })
    await expect(add).toBeDisabled()
    await userEvent.click(add)
    await expect(args.state.dispatch).not.toHaveBeenCalled()
  },
}
export const SaveCard: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Outline the launch plan' }))
    const title = canvas.getByRole('textbox', { name: 'Title' })
    await userEvent.clear(title)
    await userEvent.type(title, 'Updated launch plan')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(await canvas.findByRole('button', { name: 'Updated launch plan' })).toBeVisible()
    await expect(args.state.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'edit-card', id: 'plan' }))
    await expect(args.notify).toHaveBeenCalledWith('Board saved')
    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
  },
}
