import { activityDays, type BoardActivity } from '../../data/board-activity'
import './ticket-activity.css'

interface Props { activity?: BoardActivity; today: number; peak: number; projectName: string; unavailable: boolean }
export function TicketActivity({ activity, today, peak, projectName, unavailable }: Props) {
  const days = activityDays(activity, today)
  const total = days.reduce((sum, { count }) => sum + count, 0)
  const points = days.map(({ count }, index) => `${(2 + index * 100 / 6).toFixed(2)},${(26 - count / peak * 24).toFixed(2)}`).join(' ')
  const changes = total === 1 ? 'change' : 'changes'
  const label = unavailable ? `Activity for ${projectName}: unavailable`
    : `Activity for ${projectName}: ${total} recorded ${changes} in the last 7 days`
  return <details className="ticket-activity" onKeyDown={(event) => {
    if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() }
  }}>
    <summary data-total={unavailable ? '–' : total} aria-label={label} aria-description="Daily activity, oldest to newest. Graphs share one scale across loaded projects.">
      <svg className="ticket-activity-sparkline" viewBox="0 0 104 28" aria-hidden="true" focusable="false"
        data-state={unavailable ? 'unknown' : total === 0 ? 'empty' : 'recorded'}>
        <polyline points={unavailable ? '2,26 102,26' : points} />
      </svg>
    </summary>
    <div className="ticket-activity-breakdown">
      <p>{unavailable ? 'Activity unavailable.' : `${total} recorded ticket ${changes}`}</p>
      {!unavailable && <ul role="list">{days.map(({ date, count }) => <li key={date}><time dateTime={date}>{date}</time><span>{count}</span></li>)}</ul>}
      <small>Last 7 days, including today (IST). Tracks ticket creation, edits, moves, and deletion. No historical backfill.</small>
    </div>
  </details>
}
