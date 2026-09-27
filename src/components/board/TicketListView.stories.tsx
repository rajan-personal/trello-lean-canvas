import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import type { TicketListProject } from '../../app/useWorkspaceTicketList'
import { defaultBoardColumns } from '../../data/board'
import { activityDay, ACTIVITY_TIME_ZONE } from '../../data/board-activity'
import { TicketListView } from './TicketListView'

const project = (id: string, name: string, favorite = false, notes = ''): TicketListProject => ({
  canvas: { id, name, title: name, favorite, notes, sections: [] }, loading: false, error: null,
  summary: { activity: { timeZone: ACTIVITY_TIME_ZONE, throughDay: activityDay(), counts: [0, 1, 3, 0, 7, 12, 2] }, columns: defaultBoardColumns, cards: [
    { id: 'plan', columnId: 'backlog', title: 'Plan release', rank: 'a' },
    { id: 'build', columnId: 'todo', title: 'Build release', rank: 'a' },
    { id: 'review', columnId: 'review', title: 'Review release', rank: 'a' },
    { id: 'review-again', columnId: 'review', title: 'Review documentation', rank: 'b' },
  ] },
})
const projects = [
  project('launch', 'Product launch', true, 'Bring the next release to life with a focused plan and a smooth rollout.'),
  project('research', 'Customer research', true, 'Listen to early customers and turn their feedback into a better product.'),
  project('canvas', 'Lean Canvas', true, 'Map the problem, explore solutions, and validate the business model.'),
  project('website', 'Website refresh', false, 'A clearer story and a simpler experience for everyone who visits.'),
  project('ideas', 'Ideas & experiments', false, 'Small experiments worth exploring when there is room to try something new.'),
  project('docs', 'Documentation', false, 'Keep the team’s knowledge organized and easy to find.'),
]
const meta = {
  title: 'Lean Canvas/TicketListView', component: TicketListView, tags: ['autodocs'], parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div style={{ height: '100dvh', display: 'flex', background: 'linear-gradient(130deg, #0c66e4, #338bfa)' }}><Story /></div>],
  args: { projects, blocked: false, onOpenProjectBoard: fn(), onRetry: fn() },
} satisfies Meta<typeof TicketListView>
export default meta
type Story = StoryObj<typeof meta>
export const Populated: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('main', { name: 'All tickets' })).toBeVisible()
    const list = within(canvas.getByRole('list', { name: 'Projects' }))
    await expect(list.getAllByRole('button', { name: /Open board for/ })).toHaveLength(6)
    await expect(canvas.queryByText(/High Priority|Low Priority/)).not.toBeInTheDocument()
    await expect(list.getByRole('button', { name: 'Open board for Product launch' })).toHaveAccessibleDescription('Starred project')
    const counts = within(canvas.getByRole('list', { name: 'Task counts for Product launch' }))
    await expect(counts.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Backlog: 1', 'Todo: 1', 'In Review: 2'])
    await userEvent.click(list.getByRole('button', { name: 'Open board for Product launch' }))
    await expect(args.onOpenProjectBoard).toHaveBeenCalledWith('launch')
  },
}
export const Loading: Story = {
  args: { projects: [{ ...project('loading', 'Loading project'), loading: true, summary: undefined }] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading tickets')
    await expect(canvas.getByRole('list', { name: 'Task counts for Loading project' })).toHaveTextContent('Backlog: —Todo: —In Review: —')
    const activity = canvas.getByLabelText('Activity for Loading project: unavailable')
    await expect(activity.querySelector('svg')).toHaveAttribute('data-state', 'unknown')
    await expect(activity.querySelector('polyline')).toHaveAttribute('points', '2,26 102,26')
    const counts = canvas.getByRole('list', { name: 'Task counts for Loading project' })
    await expect(counts.querySelectorAll('[data-unavailable]')).toHaveLength(3)
    await expect(counts.querySelectorAll('.ticket-status-bar')).toHaveLength(0)
  },
}
export const PartialProjectStates: Story = {
  args: { projects: [projects[0], { ...project('loading', 'Loading project'), loading: true }, { ...project('error', 'Needs retry'), error: 'Offline' }] },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading tickets')
    await expect(canvas.getByRole('alert')).toHaveTextContent('Tickets could not be loaded')
    const activity = canvas.getByLabelText('Activity for Needs retry: unavailable')
    await expect(activity.querySelector('svg')).toHaveAttribute('data-state', 'unknown')
    await expect(activity.querySelector('polyline')).toHaveAttribute('points', '2,26 102,26')
    const counts = canvas.getByRole('list', { name: 'Task counts for Needs retry' })
    await expect(counts.querySelectorAll('[data-unavailable]')).toHaveLength(3)
    await expect(counts.querySelectorAll('.ticket-status-bar')).toHaveLength(0)
    await userEvent.click(canvas.getByRole('button', { name: 'Retry loading tickets for Needs retry' }))
    await expect(args.onRetry).toHaveBeenCalledWith('error')
    await expect(args.onOpenProjectBoard).not.toHaveBeenCalled()
    await expect(canvas.getByRole('button', { name: 'Open board for Product launch' })).toBeVisible()
  },
}
export const EmptyWorkspace: Story = { args: { projects: [] }, play: async ({ canvas }) => { await expect(canvas.getByRole('status')).toHaveTextContent('No projects yet') } }
export const EmptyProject: Story = {
  args: { projects: [{ ...project('empty', 'Empty project'), summary: { columns: [], cards: [] } }] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Open board for Empty project' })).toBeVisible()
    await expect(canvas.getByRole('list', { name: 'Task counts for Empty project' })).toHaveTextContent('Backlog: 0Todo: 0In Review: 0')
    await expect(canvas.queryByText('No description yet.')).not.toBeInTheDocument()
    await expect(canvas.queryByText('7 days', { exact: true })).not.toBeInTheDocument()
    await expect(canvas.getByLabelText('Activity for Empty project: 0 recorded changes in the last 7 days')).toBeVisible()
  },
}
export const Blocked: Story = { args: { blocked: true }, play: async ({ canvas }) => {
  for (const button of canvas.getAllByRole('button', { name: /Open board for/ })) await expect(button).toBeDisabled()
} }
export const Mobile: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } }
export const LongDataMobile: Story = {
  args: { projects: [project('long', 'Customer research and product discovery with a very long project name', false, 'A long description with enough detail to wrap across multiple lines. '.repeat(10))] },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
}
