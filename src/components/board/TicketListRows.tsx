import { storyPointLabel, type BoardSummary } from '../../data/board'
import type { TicketListProjectGroup, TicketListRow } from '../../data/board-summary-order'
import type { LeanCanvas } from '../../data/types'

export interface TicketListProject {
  canvas: LeanCanvas
  loading: boolean
  summary?: BoardSummary
  error: string | null
}
interface Actions {
  blocked: boolean
  onOpenProjectBoard: (projectId: string) => void
}
interface TicketActions extends Actions {
  onOpenTicket: (projectId: string, ticketId: string) => void
}

function ProjectButton({ projectId, projectName, blocked, onOpenProjectBoard }: Actions & { projectId: string; projectName: string }) {
  return <button type="button" className="ticket-list-project-button" aria-label={`Open board for ${projectName}`}
    disabled={blocked} onClick={() => onOpenProjectBoard(projectId)}>{projectName}</button>
}
function TicketRow({ row, blocked, onOpenTicket }: TicketActions & { row: TicketListRow }) {
  const { card } = row
  const points = card.storyPoints == null ? '' : `; Points: ${storyPointLabel(card.storyPoints)}`
  return <tr className="ticket-list-ticket-row" data-project-id={row.projectId} data-ticket-id={card.id}>
    <th scope="row" className="ticket-list-ticket-cell"><button type="button" className="ticket-list-ticket-button"
      aria-label={`${card.title} — ${row.projectName}; Status: ${row.status}${points}`} disabled={blocked} onClick={() => onOpenTicket(row.projectId, card.id)}>
      <span className="ticket-list-ticket-title">{card.title}</span>
    </button></th>
    <td className="ticket-list-project-cell"><span className="ticket-list-visually-hidden">{row.projectName}</span></td>
    <td className="ticket-list-status-cell">{row.status}</td>
    <td className="ticket-list-points-cell" aria-label={card.storyPoints == null ? 'No story points' : undefined}>{card.storyPoints == null
      ? <span aria-hidden="true">—</span> : storyPointLabel(card.storyPoints)}</td>
  </tr>
}
export function TicketProjectGroup({ group, blocked, onOpenProjectBoard, onOpenTicket }: TicketActions & { group: TicketListProjectGroup }) {
  const count = group.rows.length
  return <tbody className="ticket-list-project-group" aria-label={`${group.projectName}, ${count} ${count === 1 ? 'ticket' : 'tickets'}`}>
    <tr className="ticket-list-project-row"><th scope="rowgroup" colSpan={4}>
      <ProjectButton projectId={group.projectId} projectName={group.projectName} blocked={blocked} onOpenProjectBoard={onOpenProjectBoard} />
      <span className="ticket-list-project-count">{count}</span>
    </th></tr>
    {group.rows.map((row) => <TicketRow key={row.card.id} row={row} blocked={blocked} onOpenTicket={onOpenTicket} onOpenProjectBoard={onOpenProjectBoard} />)}
  </tbody>
}
export function TicketProjectStates({ projects, blocked, onOpenProjectBoard, onRetry }: Actions & {
  projects: TicketListProject[]
  onRetry: (projectId: string) => void
}) {
  return <>{projects.map((project) => {
    const { canvas } = project
    if (!project.loading && !project.error) return null
    return <tbody key={canvas.id} className="ticket-list-project-group ticket-list-state-group"><tr className="ticket-list-project-row"><th scope="rowgroup" colSpan={4}>
      <ProjectButton projectId={canvas.id} projectName={canvas.name} blocked={blocked} onOpenProjectBoard={onOpenProjectBoard} />
      {project.loading ? <span className="ticket-list-message" role="status">Loading tickets…</span> : <span className="ticket-list-error" role="alert">Tickets could not be loaded.<button type="button" aria-label={`Retry loading tickets for ${canvas.name}`} onClick={() => onRetry(canvas.id)}>Retry</button></span>}
    </th></tr></tbody>
  })}</>
}
