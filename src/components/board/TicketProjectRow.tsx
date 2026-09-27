import { Star } from 'lucide-react'
import type { TicketListProject } from '../../app/useWorkspaceTicketList'
import { projectTicketCounts, ticketCountStatuses } from '../../data/ticket-project-summary'
import { TicketActivity } from './TicketActivity'

interface Props {
  project: TicketListProject
  blocked: boolean
  today: number
  onOpenProjectBoard: (projectId: string) => void
  onRetry: (projectId: string) => void
}

export function TicketProjectRow({ project, blocked, today, onOpenProjectBoard, onRetry }: Props) {
  const { canvas, loading, error, summary } = project
  const counts = projectTicketCounts(summary)
  const unavailable = loading || Boolean(error) || !summary
  return <li className="ticket-project-row" data-project-id={canvas.id}>
    <h2 className="ticket-project-title"><button type="button" className="ticket-project-open"
      aria-label={`Open board for ${canvas.name}`} aria-description={canvas.favorite ? 'Starred project' : undefined}
      disabled={blocked} onClick={() => onOpenProjectBoard(canvas.id)}>
      <span className="ticket-project-star-slot" aria-hidden="true">{canvas.favorite && <Star className="ticket-project-star" size={15} />}</span>
      <span className="ticket-project-name">{canvas.name}</span>
    </button></h2>
    <ul className="ticket-project-counts" role="list" aria-label={`Task counts for ${canvas.name}`}>
      {ticketCountStatuses.map(({ id, label }) => <li key={id} className={`ticket-count ticket-count-${id}`}
        title={`${label}: ${unavailable ? 'Not available' : counts[id]}`}>
        <span className="ticket-list-visually-hidden">{label}: </span>{unavailable ? '—' : counts[id]}
      </li>)}
    </ul>
    {loading ? <p className="ticket-project-state" role="status">Loading tickets…</p>
      : error ? <div className="ticket-project-error" role="alert">Tickets could not be loaded.
        <button type="button" disabled={blocked} aria-label={`Retry loading tickets for ${canvas.name}`} onClick={() => onRetry(canvas.id)}>Retry</button>
      </div> : null}
    <TicketActivity activity={summary?.activity} today={today} projectName={canvas.name} unavailable={unavailable} />
  </li>
}
