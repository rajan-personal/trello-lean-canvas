import { storyPointLabel, type BoardSummary } from '../../data/board'
import type { LeanCanvas } from '../../data/types'
import { summaryGroups, type BoardSummaryGroup } from '../../data/board-summary-order'
import './ticket-list.css'

interface Project { canvas: LeanCanvas; loading: boolean; summary?: BoardSummary; error: string | null }
interface Props {
  projects: Project[]; blocked: boolean
  onOpenTicket: (projectId: string, ticketId: string) => void
  onOpenProjectBoard: (projectId: string) => void
  onRetry: (projectId: string) => void
}
function StatusGroup({ group, blocked, projectId, projectName, onOpenTicket }: { group: BoardSummaryGroup; blocked: boolean; projectId: string; projectName: string; onOpenTicket: Props['onOpenTicket'] }) {
  const { column, cards } = group
  return <section className="ticket-list-status">
    <header><h3>{column.title}</h3><span className="ticket-list-count">{cards.length}</span></header>
    <ul className="ticket-list-cards">
      {cards.map((card) => <li key={`${projectId}:${card.id}`}>
        <button type="button" className="ticket-list-card" aria-label={`${card.title} — ${projectName}${card.storyPoints != null ? `; Points: ${storyPointLabel(card.storyPoints)}` : ''}`} disabled={blocked} onClick={() => onOpenTicket(projectId, card.id)}>
          <span className="ticket-list-card-title">{card.title}</span>
          {card.storyPoints != null && <span className="ticket-list-points">Points: {storyPointLabel(card.storyPoints)}</span>}
        </button>
      </li>)}
    </ul>
  </section>
}
function ProjectSection({ project, blocked, onOpenTicket, onOpenProjectBoard, onRetry }: { project: Project; blocked: boolean; onOpenTicket: Props['onOpenTicket']; onOpenProjectBoard: Props['onOpenProjectBoard']; onRetry: Props['onRetry'] }) {
  const { canvas, summary } = project
  const groups = summary ? summaryGroups(summary) : []
  return <section className="ticket-list-project">
    <header><h2>{canvas.name}</h2><button type="button" className="ticket-list-board-link" aria-label={`Open board for ${canvas.name}`} disabled={blocked} onClick={() => onOpenProjectBoard(canvas.id)}>Open board</button></header>
    {project.loading && <p className="ticket-list-message" role="status">Loading tickets…</p>}
    {!project.loading && project.error && <div className="ticket-list-error" role="alert">Tickets could not be loaded.<button type="button" aria-label={`Retry loading tickets for ${canvas.name}`} onClick={() => onRetry(canvas.id)}>Retry</button></div>}
    {!project.loading && !project.error && summary && (groups.length ? <div className="ticket-list-statuses">{groups.map((group) => <StatusGroup key={group.column.id} group={group} blocked={blocked} projectId={canvas.id} projectName={canvas.name} onOpenTicket={onOpenTicket} />)}</div> : <p className="ticket-list-message" role="status">No tickets in this project yet.</p>)}
  </section>
}
export function TicketListView({ projects, blocked, onOpenTicket, onOpenProjectBoard, onRetry }: Props) {
  return <main className="ticket-list-area" aria-labelledby="all-tickets-heading">
    <div className="ticket-list-content"><header className="ticket-list-heading"><h1 id="all-tickets-heading">All tickets</h1><p>Tickets from every project, grouped by status.</p></header>
      {projects.length ? <div className="ticket-list-projects">{projects.map((project) => <ProjectSection key={project.canvas.id} project={project} blocked={blocked} onOpenTicket={onOpenTicket} onOpenProjectBoard={onOpenProjectBoard} onRetry={onRetry} />)}</div> : <p className="ticket-list-message" role="status">No projects yet.</p>}
    </div>
  </main>
}
