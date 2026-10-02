import { useEffect, useState } from 'react'
import { Circle, GitPullRequest, LoaderCircle, Star } from 'lucide-react'
import type { TicketListProject } from '../../app/useWorkspaceTicketList'
import { projectActiveTickets, projectTicketCounts, ticketCountStatuses } from '../../data/ticket-project-summary'
import { TicketActivity } from './TicketActivity'

interface Props {
  project: TicketListProject
  blocked: boolean
  today: number
  statusPeak: number
  activityPeak: number
  onOpenProjectBoard: (projectId: string) => void
  onOpenTicket: (projectId: string, ticketId: string) => void
  onRetry: (projectId: string) => void
}

export function TicketProjectRow({ project, blocked, today, statusPeak, activityPeak, onOpenProjectBoard, onOpenTicket, onRetry }: Props) {
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  useEffect(() => {
    if (!activeStatus) return
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') setActiveStatus(null) }
    window.addEventListener('keydown', dismiss)
    return () => window.removeEventListener('keydown', dismiss)
  }, [activeStatus])
  const { canvas, loading, error, summary } = project
  const counts = projectTicketCounts(summary)
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
    <ul className="ticket-project-counts" role="list" aria-label={`Task counts for ${canvas.name}`}
      aria-description="Bar heights share one scale across all projects, using the largest loaded status count.">
      {ticketCountStatuses.map(({ id, label }) => <li key={id} className={`ticket-count ticket-count-${id}`}
        onMouseEnter={() => setActiveStatus(id)} onMouseLeave={(event) => {
          if (!event.currentTarget.contains(document.activeElement)) setActiveStatus(null)
        }}>
        <button type="button" className="ticket-status-trigger" aria-label={`${label}: ${unavailable ? 'Not available' : counts[id]}`}
          data-count={unavailable ? '–' : counts[id]}
          onFocus={() => setActiveStatus(id)} onBlur={() => setActiveStatus(null)} onClick={() => setActiveStatus(id)}>
          <span className="ticket-status-track" data-unavailable={unavailable || undefined}
            data-zero={!unavailable && counts[id] === 0 || undefined} aria-hidden="true">
            {!unavailable && <span className="ticket-status-bar" style={{ height: `${counts[id] / statusPeak * 100}%` }} />}
          </span>
        </button>
        <span className="ticket-status-value" hidden={activeStatus !== id} aria-hidden="true">{label}: {unavailable ? '—' : counts[id]}</span>
      </li>)}
    </ul>
    {loading ? <p className="ticket-project-state" role="status">Loading tickets…</p>
      : error ? <div className="ticket-project-error" role="alert">Tickets could not be loaded.
        <button type="button" disabled={blocked} aria-label={`Retry loading tickets for ${canvas.name}`} onClick={() => onRetry(canvas.id)}>Retry</button>
      </div> : null}
    <TicketActivity activity={summary?.activity} today={today} peak={activityPeak} projectName={canvas.name} unavailable={unavailable} />
    </div>
    {!unavailable && (tickets.length ? <ul className="ticket-active-list" aria-label={`Active tickets for ${canvas.name}`}>
      {tickets.map((ticket) => {
        const label = ticketCountStatuses.find(({ id }) => id === ticket.status)!.label
        const Icon = ticket.status === 'in-progress' ? LoaderCircle : ticket.status === 'review' ? GitPullRequest : Circle
        return <li key={ticket.id}>
          <button type="button" className={`ticket-active-open ticket-active-${ticket.status}`} disabled={blocked}
            aria-label={`${ticket.title}, ${label}`} title={label} onClick={() => onOpenTicket(canvas.id, ticket.id)}>
            <Icon className="ticket-active-icon" size={15} aria-hidden="true" />
            <span className="ticket-active-title">{ticket.title}</span>
          </button>
        </li>
      })}
    </ul> : <p className="ticket-active-empty">No active tickets.</p>)}
  </li>
}
