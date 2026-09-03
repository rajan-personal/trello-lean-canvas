import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import type { LeanCanvas } from '../data/types'
import { storyCanvas } from '../components/component-story-fixtures'
import { Workspace } from './Workspace'

const STORAGE_KEY = 'lean-canvas:v2'
const user = {
  uid: 'storybook-user',
  displayName: 'Storybook User',
  email: 'storybook@example.com',
  photoURL: null,
}

function SeededWorkspace({ canvases }: { canvases: LeanCanvas[] }) {
  const [ready] = useState(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
    return true
  })
  return ready ? (
    <Workspace user={user} onSignOut={() => {}} persistence="local" />
  ) : null
}

const meta = {
  title: 'Screens/Workspace',
  component: Workspace,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { user, onSignOut: () => {}, persistence: 'local' },
} satisfies Meta<typeof Workspace>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {
  render: () => <SeededWorkspace canvases={[storyCanvas]} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: 'Team alignment' }),
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
    await expect(canvas.queryByRole('heading')).not.toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: 'Add canvas' }),
    ).toBeInTheDocument()
  },
}
