import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor } from 'storybook/test'
import { TicketRunStory } from './TicketRun.story-support'
import './kanban.css'

const meta = { title: 'Kanban/Codex run', component: TicketRunStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TicketRunStory>
export default meta
type Story = StoryObj<typeof meta>
export const Ready: Story = {}
export const MobileReady: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } }
export const MobileRunning: Story = { ...MobileReady, args: { status: 'running' } }
export const MobileResult: Story = { ...MobileReady, args: { status: 'ready_for_review' } }
export const Disconnected: Story = { args: { connected: false }, play: async ({ canvas }) => {
  await expect(canvas.getByRole('button', { name: 'Run Codex' })).toBeDisabled()
  await expect(canvas.getByText('Connect Lean in Work to run this ticket.')).toBeVisible()
} }
export const Blocked: Story = { args: { status: 'blocked' }, play: async ({ canvas }) => {
  await expect(canvas.getByRole('button', { name: 'Needs input' })).toBeDisabled()
} }
export const Failed: Story = { args: { status: 'failed' } }
export const Stale: Story = { args: { status: 'running', stale: true }, play: async ({ canvas }) => {
  await expect(canvas.getByText('No recent update. Check the run in Work.')).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Running' })).toBeDisabled()
} }
export const QueueTicket: Story = { play: async ({ canvas }) => {
  const button = canvas.getByRole('button', { name: 'Run Codex' })
  await waitFor(() => expect(button).toBeEnabled())
  await userEvent.click(button)
  await expect(canvas.findByRole('button', { name: 'Queued' })).resolves.toBeDisabled()
  await expect(canvas.getByText('Waiting for Work to pick up this ticket.')).toBeVisible()
  await expect(canvas.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Backlog')
} }
export const UnsavedTicket: Story = { play: async ({ canvas }) => {
  await userEvent.type(canvas.getByRole('textbox', { name: 'Title' }), ' — revised')
  await expect(canvas.getByRole('button', { name: 'Run Codex' })).toBeDisabled()
  await expect(canvas.getByText('Save your changes before running Codex.')).toBeVisible()
} }
export const RequestFailure: Story = { args: { fail: true }, play: async ({ canvas }) => {
  const button = canvas.getByRole('button', { name: 'Run Codex' })
  await waitFor(() => expect(button).toBeEnabled()); await userEvent.click(button)
  await expect(canvas.findByRole('alert')).resolves.toHaveTextContent('Couldn’t queue this run. Try again.')
  await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
  await waitFor(() => expect(canvas.getByRole('button', { name: 'Run Codex' })).toBeEnabled())
} }

export const LongResult: Story = { args: { status: 'ready_for_review', long: true } }
export const RemoteEdit: Story = { args: { remote: true } }
