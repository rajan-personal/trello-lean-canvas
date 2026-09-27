import { activityDays, type BoardActivity } from '../../data/board-activity'
import './ticket-activity.css'

interface Props { activity?: BoardActivity; today: number; projectName: string; unavailable: boolean }
const level = (count: number) => count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4
export function TicketActivity({ activity, today, projectName, unavailable }: Props) {
  const days = activityDays(activity, today)
  const total = days.reduce((sum, { count }) => sum + count, 0)
  const changes = total === 1 ? 'change' : 'changes'
  const label = unavailable ? `Activity for ${projectName}: unavailable`
    : `Activity for ${projectName}: ${total} recorded ${changes} in the last 7 days`
  return <details className="ticket-activity" onKeyDown={(event) => {
    if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() }
  }}>
    <summary aria-label={label}>
      <span className="ticket-activity-squares" aria-hidden="true">
        {days.map(({ date, count }) => <span key={date} className="ticket-activity-day" data-level={unavailable ? 'unknown' : level(count)} />)}
      </span>
    </summary>
    <div className="ticket-activity-breakdown">
      <p>{unavailable ? 'Activity unavailable.' : `${total} recorded ticket ${changes}`}</p>
      {!unavailable && <ul role="list">{days.map(({ date, count }) => <li key={date}><time dateTime={date}>{date}</time><span>{count}</span></li>)}</ul>}
      <small>Last 7 days, including today (IST). Tracks ticket creation, edits, moves, and deletion. No historical backfill.</small>
    </div>
  </details>
}
