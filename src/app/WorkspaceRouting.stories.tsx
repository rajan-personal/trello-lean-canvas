import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, spyOn } from 'storybook/test'
import { Workspace } from './Workspace'
import { WorkspaceSeed } from './SeededWorkspace.story-support'
import { blankCanvas } from './App.story-support'
import { boardStoryData, boardStoryUser } from '../components/board/board-story-fixtures'

const canvases = [blankCanvas, { ...blankCanvas, id: 'second', name: 'Second canvas', title: 'Second canvas' }]
const boards = { [blankCanvas.id]: boardStoryData }
const meta = {
  title: 'Screens/WorkspaceRouting', component: Workspace,
  parameters: { layout: 'fullscreen', docs: { story: { inline: false } } },
  args: { user: boardStoryUser, onSignOut: fn(), persistence: 'local' },
  render: (args) => <WorkspaceSeed canvases={canvases} boards={boards}><Workspace {...args} /></WorkspaceSeed>,
} satisfies Meta<typeof Workspace>
export default meta
type Story = StoryObj<typeof meta>

export const IsolatedBoardsAndKeyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('tab', { name: 'Canvas' }))
    await userEvent.keyboard('{ArrowRight}')
    const boardTab = canvas.getByRole('tab', { name: 'Board' })
    await expect(boardTab).toHaveFocus()
    await expect(canvas.getByRole('tabpanel')).toHaveAccessibleName('Board')
    await expect(await canvas.findByRole('button', { name: 'Outline the launch plan' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Second canvas' }))
    await expect(await canvas.findByRole('heading', { name: 'Second canvas' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Outline the launch plan' })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Blank canvas' }))
    await expect(await canvas.findByRole('button', { name: 'Outline the launch plan' })).toBeVisible()
    await userEvent.click(boardTab)
    await userEvent.keyboard('{Home}')
    await expect(canvas.getByRole('tab', { name: 'Canvas' })).toHaveFocus()
    await expect(canvas.getByRole('tabpanel')).toHaveAccessibleName('Canvas')
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Favorite canvas' })).toHaveFocus()
  },
}

export const DirtyDraftNavigation: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const confirm = spyOn(window, 'confirm').mockReturnValue(false)
    try {
      await userEvent.click(await canvas.findByRole('tab', { name: 'Board' }))
      await userEvent.click((await canvas.findAllByRole('button', { name: '+ Add a card' }))[0])
      await userEvent.type(canvas.getByRole('textbox', { name: 'Card title' }), 'Keep this draft')
      await userEvent.click(canvas.getByRole('tab', { name: 'Canvas' }))
      await expect(confirm).toHaveBeenCalled()
      await expect(canvas.getByRole('tab', { name: 'Board' })).toHaveFocus()
      await expect(canvas.getByRole('textbox', { name: 'Card title' })).toHaveValue('Keep this draft')
      await userEvent.click(canvas.getByRole('button', { name: 'Sign out alex@example.test' }))
      await expect(args.onSignOut).not.toHaveBeenCalled()
      await expect(canvas.getByRole('textbox', { name: 'Card title' })).toHaveValue('Keep this draft')
      confirm.mockReturnValue(true)
      await userEvent.click(canvas.getByRole('tab', { name: 'Canvas' }))
      await expect(canvas.getByRole('tabpanel')).toHaveAccessibleName('Canvas')
      await expect(canvas.queryByRole('textbox', { name: 'Card title' })).not.toBeInTheDocument()
    } finally { confirm.mockRestore() }
  },
}
