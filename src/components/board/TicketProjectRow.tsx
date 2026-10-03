import { Circle, GitPullRequest, LoaderCircle, Star } from 'lucide-react'
import type { TicketListProject } from '../../app/useWorkspaceTicketList'
import { projectActiveTickets, ticketCountStatuses } from '../../data/ticket-project-summary'
import { ticketAncestors } from '../../data/ticket-hierarchy'
import { TicketActivity } from './TicketActivity'

interface Props {
  project: TicketListProject
  blocked: boolean
  today: number
  activityPeak: number
  onOpenProjectBoard: (projectId: string) => void
  onOpenTicket: (projectId: string, ticketId: string) => void
  onRetry: (projectId: string) => void
}

export function TicketProjectRow({ project, blocked, today, activityPeak, onOpenProjectBoard, onOpenTicket, onRetry }: Props) {
  const { canvas, loading, error, summary } = project
  const tickets = projectActiveTickets(summary)
  const unavailable = loading || Boolean(error) || !summary
  return <li className="ticket-project-row" data-project-id={canvas.id}>
    <div className="ticket-project-header">
    <h2 className="ticket-project-title"><button type="button" className="ticket-project-open"
      aria-label={`Open board for ${canvas.name}`} aria-description={canvas.favorite ? 'Starred project' : undefined}
      disabled={blocked} onClick={() => onOpenProjectBoard(canvas.id)}>
      <span className="ticket-project-star-slot" aria-hidden="true">{canvas.favorite && <Star className="ticket-project-star" size={15} />}</span>
      <span className="ticket-project-name">{canvas.name}</span>
    </button></h2>
    {!unavailable && <span className="ticket-project-total" aria-label={`Active ticket count for ${canvas.name}`}>
      {tickets.length} active {tickets.length === 1 ? 'ticket' : 'tickets'}
    </span>}
    </div>
    <div className="ticket-project-activity">
      <span className="ticket-project-activity-label" aria-hidden="true">Last 7 days</span>
      <TicketActivity activity={summary?.activity} today={today} peak={activityPeak} projectName={canvas.name} unavailable={unavailable} />
    </div>
    {loading ? <p className="ticket-project-state" role="status">Loading tickets…</p>
      : error ? <div className="ticket-project-error" role="alert">Tickets could not be loaded.
        <button type="button" disabled={blocked} aria-label={`Retry loading tickets for ${canvas.name}`} onClick={() => onRetry(canvas.id)}>Retry</button>
      </div> : null}
    {!unavailable && (tickets.length ? <ul className="ticket-active-list" aria-label={`Active tickets for ${canvas.name}`}>
      {tickets.map((ticket) => {
        const label = ticketCountStatuses.find(({ id }) => id === ticket.status)!.label
        const Icon = ticket.status === 'in-progress' ? LoaderCircle : ticket.status === 'review' ? GitPullRequest : Circle
        return <li key={ticket.id}>
          <button type="button" className={`ticket-active-open ticket-active-${ticket.status}`} disabled={blocked}
            aria-label={`${ticket.title}, ${label}`} title={label} onClick={() => onOpenTicket(canvas.id, ticket.id)}>
            <Icon className="ticket-active-icon" size={15} aria-hidden="true" />
            <span className="ticket-active-title">{ticket.title}{ticket.parentTicketId && <small className="ticket-parent-path">{ticketAncestors(summary!.cards, ticket.id).map((parent) => parent.title).join(' / ')}</small>}</span>
          </button>
        </li>
      })}
    </ul> : <p className="ticket-active-empty">No active tickets.</p>)}
  </li>
}
