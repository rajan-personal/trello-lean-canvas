import type { TicketListProject } from '../../app/useWorkspaceTicketList'
import { ticketCountStatuses } from '../../data/ticket-project-summary'
import { TicketProjectRow } from './TicketProjectRow'
import './ticket-list.css'
import { useActivityDay } from './useActivityDay'

interface Props {
  projects: TicketListProject[]
  blocked: boolean
  onOpenProjectBoard: (projectId: string) => void
  onRetry: (projectId: string) => void
}

export function TicketListView({ projects, blocked, onOpenProjectBoard, onRetry }: Props) {
  const today = useActivityDay()
  return <main className="ticket-list-area" aria-labelledby="all-tickets-heading">
    <div className="ticket-list-content">
      <header className="ticket-list-heading">
        <h1 id="all-tickets-heading" className="ticket-list-visually-hidden">All tickets</h1>
        <ul className="ticket-list-legend" role="list" aria-label="Task status colors">
          {ticketCountStatuses.map(({ id, label }) => <li key={id}><span className={`ticket-count ticket-count-${id}`} aria-hidden="true" />{label}</li>)}
        </ul>
      </header>
      {projects.length ? <ul className="ticket-project-list" role="list" aria-label="Projects">
        {projects.map((project) => <TicketProjectRow key={project.canvas.id} project={project} blocked={blocked} today={today}
          onOpenProjectBoard={onOpenProjectBoard} onRetry={onRetry} />)}
      </ul> : <p className="ticket-list-message" role="status">No projects yet.</p>}
    </div>
  </main>
}
