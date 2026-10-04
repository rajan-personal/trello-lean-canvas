import { activityDays, type BoardActivity } from '../../data/board-activity'
import './ticket-activity.css'

const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' })

interface Props { activity?: BoardActivity; today: number; peak: number; projectName: string; unavailable: boolean }
export function TicketActivity({ activity, today, peak, projectName, unavailable }: Props) {
  const days = activityDays(activity, today)
  const total = days.reduce((sum, { count }) => sum + count, 0)
  // Seven 6px bars (3px gaps) on a 60×20 grid above a hairline baseline; zero or unknown days draw no bar.
  const bars = days.map(({ date, count }, index) => {
    const height = unavailable || count === 0 ? 0 : Math.max(2, Math.round(count / peak * 18 * 100) / 100)
    return { date, zero: unavailable || count === 0, x: index * 9, y: Number((19 - height).toFixed(2)), height }
  })
  const dayPeak = Math.max(1, ...days.map(({ count }) => count))
  const changes = total === 1 ? 'change' : 'changes'
  const label = unavailable ? `Activity for ${projectName}: unavailable`
    : `Activity for ${projectName}: ${total} recorded ${changes} in the last 7 days`
  return <details className="ticket-activity" onKeyDown={(event) => {
    if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() }
  }}>
    <summary title="Ticket changes in the last 7 days" aria-label={label} aria-description="Daily activity, oldest to newest. Graphs share one scale across loaded projects.">
      <svg className="ticket-activity-sparkline" viewBox="0 0 60 20" aria-hidden="true" focusable="false"
        data-state={unavailable ? 'unknown' : total === 0 ? 'empty' : 'recorded'}>
        <line className="ticket-activity-baseline" x1="0" y1="19.5" x2="60" y2="19.5" />
        {bars.map(({ date, zero, x, y, height }) => <rect key={date} x={x} y={y} width="6" height={height} rx="1.5" data-zero={zero || undefined} />)}
      </svg>
    </summary>
    <div className="ticket-activity-breakdown">
      <p>{unavailable ? 'Activity unavailable.' : `${total} recorded ticket ${changes}`}</p>
      {!unavailable && <ul role="list">{days.map(({ date, count }, index) =>
        <li key={date} title={`${date}: ${count}`} data-today={index === days.length - 1 || undefined} data-zero={count === 0 || undefined}>
          <span>{count}</span>
          <div className="ticket-activity-day-bar" style={{ blockSize: `${count ? Math.max(8, count / dayPeak * 100) : 0}%` }} />
          <time dateTime={date}>{index === days.length - 1 ? 'Today' : weekday.format(new Date(`${date}T00:00:00Z`))}</time>
        </li>)}</ul>}
      <small>Last 7 days, including today (IST). Counts ticket creates, edits, moves, and deletes.</small>
    </div>
  </details>
}
