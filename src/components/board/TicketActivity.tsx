import { activityDays, type BoardActivity } from '../../data/board-activity'
import './ticket-activity.css'

interface Props { activity?: BoardActivity; today: number; peak: number; projectName: string; unavailable: boolean }
export function TicketActivity({ activity, today, peak, projectName, unavailable }: Props) {
  const days = activityDays(activity, today)
  const total = days.reduce((sum, { count }) => sum + count, 0)
  // Seven bars on a 104×28 grid; zero (or unknown) days keep a 2px stub so the week stays readable.
  const bars = days.map(({ date, count }, index) => {
    const height = unavailable ? 2 : Math.max(2, Math.round(count / peak * 24 * 100) / 100)
    return { date, zero: unavailable || count === 0, x: Number((index * 92 / 6).toFixed(2)), y: Number((26 - height).toFixed(2)), height }
  })
  const changes = total === 1 ? 'change' : 'changes'
  const label = unavailable ? `Activity for ${projectName}: unavailable`
    : `Activity for ${projectName}: ${total} recorded ${changes} in the last 7 days`
  return <details className="ticket-activity" onKeyDown={(event) => {
    if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() }
  }}>
    <summary title="Ticket changes in the last 7 days" data-total={unavailable ? '–' : total} aria-label={label} aria-description="Daily activity, oldest to newest. Graphs share one scale across loaded projects.">
      <svg className="ticket-activity-sparkline" viewBox="0 0 104 28" aria-hidden="true" focusable="false"
        data-state={unavailable ? 'unknown' : total === 0 ? 'empty' : 'recorded'}>
        {bars.map(({ date, zero, x, y, height }) => <rect key={date} x={x} y={y} width="12" height={height} rx="1.5" data-zero={zero || undefined} />)}
      </svg>
    </summary>
    <div className="ticket-activity-breakdown">
      <p>{unavailable ? 'Activity unavailable.' : `${total} recorded ticket ${changes}`}</p>
      {!unavailable && <ul role="list">{days.map(({ date, count }) => <li key={date}><time dateTime={date}>{date}</time><span>{count}</span></li>)}</ul>}
      <small>Last 7 days, including today (IST). Tracks ticket creation, edits, moves, and deletion. No historical backfill.</small>
    </div>
  </details>
}
