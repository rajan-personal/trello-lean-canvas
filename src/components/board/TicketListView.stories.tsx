import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import type { BoardSummary } from '../../data/board'
import type { LeanCanvas } from '../../data/types'
import { TicketListView } from './TicketListView'

const canvas = (id: string, name: string): LeanCanvas => ({ id, name, title: name, favorite: false, notes: '', sections: [] })
const summary = (prefix: string): BoardSummary => ({
  columns: [{ id: `${prefix}-custom`, title: 'Needs review' }, { id: `${prefix}-done`, title: 'Done' }],
  cards: [
    { id: 'shared-card', columnId: `${prefix}-custom`, title: 'Plan release', rank: 'a', storyPoints: 3 },
    { id: 'done-card', columnId: `${prefix}-done`, title: 'Ship update', rank: 'a' },
  ],
})
const project = (id: string, name: string): { canvas: LeanCanvas; loading: boolean; summary: BoardSummary; error: null } => ({ canvas: canvas(id, name), loading: false, summary: summary(id), error: null })
const emptyProject = project('empty', 'Empty project')
emptyProject.summary = { columns: [], cards: [] }
const longProject = project('long', 'Customer research and product discovery with a very long project name')
longProject.summary = {
  columns: [{ id: 'long-status', title: 'Waiting for customer validation and stakeholder review' }],
  cards: [{ id: 'long-card', columnId: 'long-status', title: 'A ticket title with enough detail to wrap across multiple lines and preserve every word', rank: 'a', storyPoints: 8 }],
}
const meta = {
  title: 'Lean Canvas/TicketListView', component: TicketListView, tags: ['autodocs'], parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div style={{ minHeight: '100dvh', background: 'linear-gradient(130deg, #0c66e4, #338bfa)' }}><Story /></div>],
  args: { projects: [project('project-a', 'Product launch'), project('project-b', 'Customer research')], blocked: false, onOpenTicket: fn(), onOpenProjectBoard: fn(), onRetry: fn() },
} satisfies Meta<typeof TicketListView>
export default meta
type Story = StoryObj<typeof meta>
export const Populated: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('main', { name: 'All tickets' })).toBeVisible()
    await expect(canvas.getByRole('table', { name: 'Tickets grouped by project' })).toBeVisible()
    await expect(canvas.getByRole('columnheader', { name: /Ticket/ })).toBeVisible()
    await expect(canvas.getByRole('columnheader', { name: /Project/ })).toBeVisible()
    await expect(canvas.getByRole('columnheader', { name: /Status/ })).toBeVisible()
    await expect(canvas.queryByText('Tickets from every project. Sort the Project or Status columns to change row order.')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Open a project board:')).not.toBeInTheDocument()
    await expect(canvas.getByText(/Projects in sidebar order/)).toHaveClass('ticket-list-visually-hidden')
    await expect(canvas.queryByRole('button', { name: /Filter Project|Sort Project/ })).not.toBeInTheDocument()
    await expect(canvas.getAllByRole('button', { name: /Open board for/ }).map((button) => button.textContent)).toEqual(['Product launch', 'Customer research'])
    await expect(canvas.getAllByRole('button', { name: /^Plan release/ })).toHaveLength(2)
    await userEvent.click(canvas.getAllByRole('button', { name: /^Plan release/ })[0])
    await expect(args.onOpenTicket).toHaveBeenCalledWith('project-a', 'shared-card')
    await userEvent.click(canvas.getByRole('button', { name: 'Sort Status ascending' }))
    await expect(canvas.getByRole('columnheader', { name: /Status/ })).toHaveAttribute('aria-sort', 'ascending')
    await userEvent.click(canvas.getAllByRole('button', { name: /Open board for Product launch/ })[0])
    await expect(args.onOpenProjectBoard).toHaveBeenCalledWith('project-a')
  },
}
export const Loading: Story = { args: { projects: [{ canvas: canvas('loading', 'Loading project'), loading: true, error: null }] }, play: async ({ canvas }) => { await expect(canvas.getByRole('status')).toHaveTextContent('Loading tickets') } }
export const PartialProjectStates: Story = {
  args: { projects: [project('loaded', 'Loaded project'), { canvas: canvas('loading', 'Loading project'), loading: true, error: null }, { canvas: canvas('error', 'Needs retry'), loading: false, error: 'Offline' }] },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('table')).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading tickets')
    await expect(canvas.getByRole('alert')).toHaveTextContent('Tickets could not be loaded')
    await userEvent.click(canvas.getByRole('button', { name: /^Retry loading tickets for Needs retry$/ }))
    await expect(args.onRetry).toHaveBeenCalledWith('error')
    await expect(canvas.getByText('Plan release')).toBeVisible()
  },
}
export const ErrorWithRetry: Story = { args: { projects: [{ canvas: canvas('error', 'Needs retry'), loading: false, error: 'Offline' }] }, play: async ({ args, canvas, userEvent }) => { await userEvent.click(canvas.getByRole('button', { name: /^Retry loading tickets for Needs retry$/ })); await expect(args.onRetry).toHaveBeenCalledWith('error') } }
export const EmptyWorkspace: Story = { args: { projects: [] }, play: async ({ canvas }) => { await expect(canvas.getByRole('status')).toHaveTextContent('No projects yet') } }
export const EmptyProject: Story = {
  args: { projects: [emptyProject] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('navigation', { name: 'Project boards' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Open board for Empty project' })).not.toBeInTheDocument()
    await expect(canvas.queryByText('No tickets in this project yet.')).not.toBeInTheDocument()
  },
}
export const Blocked: Story = {
  args: { blocked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('button', { name: 'Open board for Product launch' })[0]).toBeDisabled()
    await expect(canvas.getAllByRole('button', { name: /^Plan release/ })[0]).toBeDisabled()
  },
}
export const Mobile: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } }
export const LongDataMobile: Story = {
  args: { projects: [longProject] },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText(longProject.canvas.name)[0]).toBeVisible()
    await expect(canvas.getByText(/A ticket title with enough detail/)).toBeVisible()
    await expect(canvas.getByText('Waiting for customer validation and stakeholder review')).toBeVisible()
    await expect(canvas.getByText('8')).toBeVisible()
  },
}
