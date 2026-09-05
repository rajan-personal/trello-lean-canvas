import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, spyOn, within } from 'storybook/test'
import { BoardScreenFixture } from './WorkspaceBoard.story-support'
import { boardStoryData, boardStoryUser } from '../components/board/board-story-fixtures'

const meta = {
  title: 'Screens/WorkspaceDeleted', component: BoardScreenFixture,
  parameters: { layout: 'fullscreen' },
  args: { user: boardStoryUser, blocked: false, notify: fn(), onDismissDeleted: fn(), register: () => () => {},
    state: { board: boardStoryData, loading: false, pending: false, error: null,
      reload: fn(async () => {}), dispatch: fn(async () => {}) } },
} satisfies Meta<typeof BoardScreenFixture>
export default meta
type Story = StoryObj<typeof meta>

export const ReadOnlyDrafts: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const confirm = spyOn(window, 'confirm').mockReturnValue(false)
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Outline the launch plan' }))
      const dialog = within(canvas.getByRole('dialog'))
      await userEvent.type(dialog.getByRole('textbox', { name: 'Description' }), ' Unsaved description')
      await userEvent.type(dialog.getByRole('textbox', { name: 'New comment' }), 'Unsaved comment')
      window.dispatchEvent(new Event('storybook:delete-canvas'))
      await expect(await dialog.findByRole('alert')).toHaveTextContent('This canvas was deleted elsewhere')
      await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveAttribute('readonly')
      await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue(`${boardStoryData.cards[0].description} Unsaved description`)
      await expect(dialog.getByRole('textbox', { name: 'New comment' })).toHaveValue('Unsaved comment')
      await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled()
      await expect(dialog.getByRole('button', { name: 'Add comment' })).toBeDisabled()
      await userEvent.click(dialog.getByRole('button', { name: 'Close dialog' }))
      await expect(canvas.getByRole('dialog')).toBeVisible()
      confirm.mockReturnValue(true)
      await userEvent.click(dialog.getByRole('button', { name: 'Close dialog' }))
      await userEvent.click(canvas.getByRole('button', { name: 'Close deleted canvas' }))
      await expect(canvas.getByRole('status')).toHaveTextContent('Deleted canvas closed')
      await expect(args.state.dispatch).not.toHaveBeenCalled()
      await expect(args.onDismissDeleted).toHaveBeenCalledOnce()
    } finally { confirm.mockRestore() }
  },
}
