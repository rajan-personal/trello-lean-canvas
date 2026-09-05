import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import type { LeanCanvas } from '../data/types'
import { storyCanvas } from '../components/component-story-fixtures'
import { Workspace } from './Workspace'
import { WorkspaceSeed } from './SeededWorkspace.story-support'

const user = {
  uid: 'storybook-user',
  displayName: 'Storybook User',
  email: 'storybook@example.com',
  photoURL: null,
}

function SeededWorkspace({ canvases }: { canvases: LeanCanvas[] }) {
  return <WorkspaceSeed canvases={canvases}>
    <Workspace user={user} onSignOut={() => {}} persistence="local" />
  </WorkspaceSeed>
}

const meta = {
  title: 'Screens/Workspace',
  component: Workspace,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { story: { inline: false } } },
  args: { user, onSignOut: () => {}, persistence: 'local' },
} satisfies Meta<typeof Workspace>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {
  render: () => <SeededWorkspace canvases={[storyCanvas]} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', { name: 'Team alignment' }),
    ).toBeInTheDocument()
    await userEvent.click(
      canvas.getByRole('button', { name: /^Notepad$/ }),
    )
    const notes = await canvas.findByRole('textbox', { name: 'Canvas notes' })
    await waitFor(() => expect(notes).toBeVisible())
    await expect(
      canvas.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeInTheDocument()
  },
}

export const Empty: Story = {
  render: () => <SeededWorkspace canvases={[]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('button', { name: 'Add canvas' })
    await expect(canvas.queryByRole('heading')).not.toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: 'Add canvas' }),
    ).toBeInTheDocument()
  },
}
