import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { Workspace } from './Workspace'
import { WorkspaceSeed } from './SeededWorkspace.story-support'
import { blankCanvas } from './App.story-support'
import { boardStoryData, boardStoryUser } from '../components/board/board-story-fixtures'

const meta = {
  title: 'Screens/Workspace account', component: Workspace,
  parameters: { layout: 'fullscreen', docs: { story: { inline: false } } },
  args: { user: boardStoryUser, onSignOut: fn(), onSetPassword: fn(async () => {}), persistence: 'local' },
  render: (args) => <WorkspaceSeed canvases={[blankCanvas]} boards={{ [blankCanvas.id]: boardStoryData }}><Workspace {...args} /></WorkspaceSeed>,
} satisfies Meta<typeof Workspace>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const WithPassword: Story = { args: { user: { ...boardStoryUser, hasPassword: true } } }
export const MenuBounds: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Account alex@example.test' }))
    const rect = within(document.body).getByRole('menu').getBoundingClientRect()
    await expect(rect.left).toBeGreaterThanOrEqual(0)
    await expect(rect.top).toBeGreaterThanOrEqual(0)
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth)
    await expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight)
  },
}
