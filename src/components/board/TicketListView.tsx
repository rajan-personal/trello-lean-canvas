import { useMemo, useState } from 'react'
import { groupTicketListRows, summaryTickets, type TicketListSort } from '../../data/board-summary-order'
import { TicketProjectGroup, TicketProjectStates, type TicketListProject } from './TicketListRows'
import './ticket-list.css'

interface Props {
  projects: TicketListProject[]; blocked: boolean
  onOpenTicket: (projectId: string, ticketId: string) => void
  onOpenProjectBoard: (projectId: string) => void
  onRetry: (projectId: string) => void
}

export function TicketListView({ projects, blocked, onOpenTicket, onOpenProjectBoard, onRetry }: Props) {
  const [sort, setSort] = useState<TicketListSort | null>(null)
  const rows = useMemo(() => summaryTickets(projects.filter(({ loading, error }) => !loading && !error)), [projects])
  const groups = useMemo(() => groupTicketListRows(rows, sort), [rows, sort])
  const toggleSort = () => setSort((current) => ({ key: 'status', direction: current?.direction === 'ascending' ? 'descending' : 'ascending' }))
  const nextDirection = sort?.direction === 'ascending' ? 'descending' : 'ascending'
  return <main className="ticket-list-area" aria-labelledby="all-tickets-heading"><div className="ticket-list-content">
    <header className="ticket-list-heading"><h1 id="all-tickets-heading" className="ticket-list-visually-hidden">All tickets</h1><p className="ticket-list-sort-status ticket-list-visually-hidden" aria-live="polite">Projects in sidebar order. {sort ? `Sorted by Status, ${sort.direction}.` : 'Tickets in board order.'} Showing {rows.length} tickets.</p></header>
    {projects.length ? <div className="ticket-list-table-shell"><table className="ticket-list-table">
      <caption className="ticket-list-visually-hidden">Tickets grouped by project</caption><colgroup><col className="ticket-list-ticket-column" /><col className="ticket-list-project-column" /><col className="ticket-list-status-column" /><col className="ticket-list-points-column" /></colgroup>
      <thead><tr><th scope="col" aria-sort="none">Ticket</th><th scope="col"><span className="ticket-list-visually-hidden">Project</span></th><th scope="col" aria-sort={sort?.direction ?? 'none'}>
        <div className="ticket-list-sort-heading"><span>Status</span><button type="button" className={`ticket-list-sort-toggle${sort ? ' is-active' : ''}`}
          aria-label={`Sort Status ${nextDirection}`} onClick={toggleSort}>
          <span aria-hidden="true">{sort?.direction === 'ascending' ? '↑' : sort?.direction === 'descending' ? '↓' : '↕'}</span>
        </button></div>
      </th><th scope="col" aria-sort="none"><span className="ticket-list-points-heading-full">Story points</span><span className="ticket-list-points-heading-short">Points</span></th></tr></thead>
      <TicketProjectStates projects={projects} blocked={blocked} onOpenProjectBoard={onOpenProjectBoard} onRetry={onRetry} />
      {groups.map((group) => <TicketProjectGroup key={group.projectId} group={group} blocked={blocked} onOpenProjectBoard={onOpenProjectBoard} onOpenTicket={onOpenTicket} />)}
    </table></div> : <p className="ticket-list-message ticket-list-empty-state" role="status">No projects yet.</p>}
  </div></main>
}
