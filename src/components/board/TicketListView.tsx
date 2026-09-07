import { useMemo, useState } from 'react'
import { storyPointLabel, type BoardSummary } from '../../data/board'
import type { LeanCanvas } from '../../data/types'
import { sortTicketListRows, summaryTickets, type TicketListRow, type TicketListSort, type TicketListSortKey } from '../../data/board-summary-order'
import './ticket-list.css'

interface Project { canvas: LeanCanvas; loading: boolean; summary?: BoardSummary; error: string | null }
interface Props {
  projects: Project[]; blocked: boolean
  onOpenTicket: (projectId: string, ticketId: string) => void
  onOpenProjectBoard: (projectId: string) => void
  onRetry: (projectId: string) => void
}
const sortLabels: Record<TicketListSortKey, string> = { project: 'Project', status: 'Status' }
type SetSort = (sortKey: TicketListSortKey) => void

function SortButton({ sortKey, sort, onSort }: { sortKey: TicketListSortKey; sort: TicketListSort; onSort: SetSort }) {
  const active = sort.key === sortKey
  const direction = active ? sort.direction : null
  const nextDirection = direction === 'ascending' ? 'descending' : 'ascending'
  const label = sortLabels[sortKey]
  return <button type="button" className={`ticket-list-sort-button${active ? ' is-active' : ''}`} aria-label={active
    ? `Sort by ${label}; currently ${direction}. Activate to sort ${nextDirection}.`
    : `Sort by ${label}; not currently sorted. Activate to sort ascending.`} onClick={() => onSort(sortKey)}>
    <span>{label}</span><span className="ticket-list-sort-icon" aria-hidden="true">{direction === 'ascending' ? '↑' : direction === 'descending' ? '↓' : '↕'}</span>
  </button>
}

function TicketRow({ row, blocked, onOpenTicket }: { row: TicketListRow; blocked: boolean; onOpenTicket: Props['onOpenTicket'] }) {
  const { card } = row
  const points = card.storyPoints == null ? '' : `; Points: ${storyPointLabel(card.storyPoints)}`
  return <tr className="ticket-list-ticket-row" data-project-id={row.projectId} data-ticket-id={card.id}>
    <th scope="row" className="ticket-list-ticket-cell"><button type="button" className="ticket-list-ticket-button"
      aria-label={`${card.title} — ${row.projectName}; Status: ${row.status}${points}`} disabled={blocked} onClick={() => onOpenTicket(row.projectId, card.id)}>
      <span className="ticket-list-ticket-title">{card.title}</span>
    </button></th>
    <td className="ticket-list-project-cell">{row.projectName}</td><td className="ticket-list-status-cell">{row.status}</td>
    <td className="ticket-list-points-cell" aria-label={card.storyPoints == null ? 'No story points' : undefined}>{card.storyPoints == null
      ? <span aria-hidden="true">—</span> : storyPointLabel(card.storyPoints)}</td>
  </tr>
}

function ProjectStateRow({ project, hasTickets, onRetry }: { project: Project; hasTickets: boolean; onRetry: Props['onRetry'] }) {
  const { canvas } = project
  if (project.loading) return <tr className="ticket-list-state-row" data-project-id={canvas.id}><td>{canvas.name}</td><td colSpan={3}><span className="ticket-list-message" role="status">Loading tickets…</span></td></tr>
  if (project.error) return <tr className="ticket-list-state-row" data-project-id={canvas.id}><td>{canvas.name}</td><td colSpan={3}><div className="ticket-list-error" role="alert"><span>Tickets could not be loaded.</span><button type="button" aria-label={`Retry loading tickets for ${canvas.name}`} onClick={() => onRetry(canvas.id)}>Retry</button></div></td></tr>
  if (!hasTickets) return <tr className="ticket-list-state-row" data-project-id={canvas.id}><td>{canvas.name}</td><td colSpan={3}><span className="ticket-list-message" role="status">No tickets in this project yet.</span></td></tr>
  return null
}

function ProjectBoards({ projects, blocked, onOpenProjectBoard }: { projects: Project[]; blocked: boolean; onOpenProjectBoard: Props['onOpenProjectBoard'] }) {
  return <nav className="ticket-list-project-boards" aria-label="Project boards"><span className="ticket-list-project-boards-label">Open a project board:</span>
    {projects.map(({ canvas }) => <button key={canvas.id} type="button" className="ticket-list-board-link" aria-label={`Open board for ${canvas.name}`} disabled={blocked} onClick={() => onOpenProjectBoard(canvas.id)}>{canvas.name}</button>)}
  </nav>
}

export function TicketListView({ projects, blocked, onOpenTicket, onOpenProjectBoard, onRetry }: Props) {
  const [sort, setSort] = useState<TicketListSort>({ key: 'project', direction: 'ascending' })
  const rows = useMemo(() => summaryTickets(projects.filter(({ loading, error }) => !loading && !error)), [projects])
  const sortedRows = useMemo(() => sortTicketListRows(rows, sort), [rows, sort])
  const ticketProjects = useMemo(() => new Set(rows.map(({ projectId }) => projectId)), [rows])
  const setSortKey: SetSort = (key) => setSort((current) => current.key === key
    ? { ...current, direction: current.direction === 'ascending' ? 'descending' : 'ascending' } : { key, direction: 'ascending' })
  return <main className="ticket-list-area" aria-labelledby="all-tickets-heading"><div className="ticket-list-content">
    <header className="ticket-list-heading"><h1 id="all-tickets-heading">All tickets</h1><p>Tickets from every project. Sort the Project or Status columns to change row order.</p><p className="ticket-list-sort-status" aria-live="polite">Sorted by {sortLabels[sort.key]}, {sort.direction}.</p></header>
    {projects.length ? <><ProjectBoards projects={projects} blocked={blocked} onOpenProjectBoard={onOpenProjectBoard} /><div className="ticket-list-table-shell"><table className="ticket-list-table">
      <caption className="ticket-list-visually-hidden">Tickets from every project</caption><colgroup><col className="ticket-list-ticket-column" /><col className="ticket-list-project-column" /><col className="ticket-list-status-column" /><col className="ticket-list-points-column" /></colgroup>
      <thead><tr><th scope="col" aria-sort="none">Ticket</th><th scope="col" aria-sort={sort.key === 'project' ? sort.direction : 'none'}><SortButton sortKey="project" sort={sort} onSort={setSortKey} /></th><th scope="col" aria-sort={sort.key === 'status' ? sort.direction : 'none'}><SortButton sortKey="status" sort={sort} onSort={setSortKey} /></th><th scope="col" aria-sort="none"><span className="ticket-list-points-heading-full">Story points</span><span className="ticket-list-points-heading-short">Points</span></th></tr></thead>
      <tbody>{projects.map((project) => <ProjectStateRow key={JSON.stringify(['state', project.canvas.id])} project={project} hasTickets={ticketProjects.has(project.canvas.id)} onRetry={onRetry} />)}{sortedRows.map((row) => <TicketRow key={JSON.stringify(['ticket', row.projectId, row.card.id])} row={row} blocked={blocked} onOpenTicket={onOpenTicket} />)}</tbody>
    </table></div></> : <p className="ticket-list-message" role="status">No projects yet.</p>}
  </div></main>
}
