import type { TicketListProject } from '../../app/useWorkspaceTicketList'
import { activityDays } from '../../data/board-activity'
import { TicketProjectRow } from './TicketProjectRow'
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
  const activityPeak = projects.reduce((peak, project) => project.loading || project.error || !project.summary ? peak
    : Math.max(peak, ...activityDays(project.summary.activity, today).map(({ count }) => count)), 1)
  return <main className="ticket-list-area" aria-labelledby="all-tickets-heading">
    <div className="ticket-list-content">
      <header className="ticket-list-heading">
        <h1 id="all-tickets-heading">All tickets</h1>
      </header>
      {projects.length ? <ul className="ticket-project-list" role="list" aria-label="Projects">
        {projects.map((project) => <TicketProjectRow key={project.canvas.id} project={project} blocked={blocked} today={today} activityPeak={activityPeak}
          onOpenProjectBoard={onOpenProjectBoard} onOpenTicket={onOpenTicket} onRetry={onRetry} />)}
      </ul> : <p className="ticket-list-message" role="status">No projects yet.</p>}
    </div>
  </main>
}
