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
const meta = {
  title: 'Lean Canvas/TicketListView', component: TicketListView, tags: ['autodocs'], parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="min-h-dvh bg-[#f7f8f9]"><Story /></div>],
  args: { projects: [project('project-a', 'Product launch'), project('project-b', 'Customer research')], blocked: false, onOpenTicket: fn(), onOpenProjectBoard: fn(), onRetry: fn() },
} satisfies Meta<typeof TicketListView>
export default meta
type Story = StoryObj<typeof meta>
export const Populated: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('main', { name: 'All tickets' })).toBeVisible()
    await expect(canvas.getByRole('table')).toBeVisible()
    await expect(canvas.getByRole('columnheader', { name: /Ticket/ })).toBeVisible()
    await expect(canvas.getAllByRole('button', { name: /^Plan release/ })).toHaveLength(2)
    await userEvent.click(canvas.getAllByRole('button', { name: /^Plan release/ })[0])
    await expect(args.onOpenTicket).toHaveBeenCalledWith('project-b', 'shared-card')
    const statusSort = canvas.getByRole('button', { name: /Sort by Status/ })
    await userEvent.click(statusSort)
    await expect(canvas.getByRole('columnheader', { name: /Status/ })).toHaveAttribute('aria-sort', 'ascending')
    await userEvent.click(canvas.getByRole('button', { name: /Open board for Product launch/ }))
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
export const Mobile: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } }
