import type { TicketListProject } from '../../app/useWorkspaceTicketList'
import { activityDays } from '../../data/board-activity'
import { projectTicketCounts, ticketCountStatuses } from '../../data/ticket-project-summary'
import { TicketProjectRow } from './TicketProjectRow'
import { ticketStatusIcons } from './ticket-status-icons'
import './ticket-list.css'
import { useActivityDay } from './useActivityDay'

interface Props {
  projects: TicketListProject[]
  blocked: boolean
  onOpenProjectBoard: (projectId: string) => void
  onOpenTicket: (projectId: string, ticketId: string) => void
  onRetry: (projectId: string) => void
}

export function TicketListView({ projects, blocked, onOpenProjectBoard, onOpenTicket, onRetry }: Props) {
  const today = useActivityDay()
  const loaded = projects.filter((project) => !project.loading && !project.error && project.summary)
  const activityPeak = loaded.reduce((peak, project) =>
    Math.max(peak, ...activityDays(project.summary!.activity, today).map(({ count }) => count)), 1)
  const totals = { todo: 0, 'in-progress': 0, review: 0 }
  for (const project of loaded) {
    const counts = projectTicketCounts(project.summary)
    for (const { id } of ticketCountStatuses) totals[id] += counts[id]
  }
  return <main className="ticket-list-area" aria-labelledby="all-tickets-heading">
    <div className="ticket-list-content">
      <header className="ticket-list-heading">
        <h1 id="all-tickets-heading">All tickets</h1>
        {loaded.length > 0 && <ul className="ticket-list-totals" aria-label="Active tickets by status">
          {ticketCountStatuses.map(({ id, label }) => {
            const Icon = ticketStatusIcons[id]
            return <li key={id} className={`ticket-total-${id}`}>
              <Icon className="ticket-total-icon" size={13} aria-hidden="true" />
              <span>{label}</span><strong>{totals[id]}</strong>
            </li>
          })}
        </ul>}
      </header>
      {projects.length ? <ul className="ticket-project-list" role="list" aria-label="Projects">
        {projects.map((project) => <TicketProjectRow key={project.canvas.id} project={project} blocked={blocked} today={today} activityPeak={activityPeak}
          onOpenProjectBoard={onOpenProjectBoard} onOpenTicket={onOpenTicket} onRetry={onRetry} />)}
      </ul> : <p className="ticket-list-message" role="status">No projects yet.</p>}
    </div>
  </main>
}
