import { Bot, ExternalLink } from 'lucide-react'
import type { BoardCard } from '../../data/board'
import { activeRun, runLabels, safePullRequestUrl } from '../../data/ticket-run'
import { useTicketRun } from './useTicketRun'
import './ticket-run.css'

export function TicketRunPanel({ card, disabled, dirty }: { card: BoardCard; disabled: boolean; dirty: boolean }) {
  const state = useTicketRun(card)
  if (!state.available) return null
  const run = state.view?.run ?? null
  const active = activeRun(run)
  const connected = !!state.view && state.view.connectedUntil > state.now
  const stale = active && run && state.now - run.updatedAt > 10 * 60 * 1000
  const url = run && safePullRequestUrl(run.prUrl)
  const hint = dirty ? 'Save your changes before running Codex.' : !state.view ? 'Loading…' :
    state.view.fromCache ? 'Reconnecting… Showing the last saved update.' :
    !connected ? 'Connect Lean in Work to run this ticket.' :
    run?.status === 'queued' ? 'Waiting for Work to pick up this ticket.' : ''
  return <section className="ticket-run" aria-label="Codex">
    <div className="ticket-run-heading">
      <h3><Bot size={17} aria-hidden="true" /> Codex</h3>
      <button type="button" disabled={disabled || dirty || state.pending || active || !connected || !state.view || state.view.fromCache || !!state.error}
        onClick={() => void state.request()}>{state.pending ? 'Queuing…' : active ? runLabels[run!.status] : run ? 'Run again' : 'Run Codex'}</button>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">
      {run && <p className="ticket-run-status"><span className="ticket-run-dot" data-status={run.status} />
        {runLabels[run.status]}<time dateTime={new Date(run.updatedAt).toISOString()} title={new Date(run.updatedAt).toLocaleString()}>
          Updated {new Date(run.updatedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time></p>}
      {run?.message && <p className="ticket-run-message">{run.message}</p>}
      {stale && <p className="ticket-run-hint">No recent update. Check the run in Work.</p>}
      {hint && <p className="ticket-run-hint">{hint}</p>}
    </div>
    {run?.summary && <p className="ticket-run-summary">{run.summary}</p>}
    {url && <a href={url} target="_blank" rel="noopener noreferrer">View pull request <ExternalLink size={14} aria-hidden="true" /></a>}
    {state.error && <p role="alert" className="ticket-run-error">{state.error} <button type="button" onClick={state.retry}>Retry</button></p>}
  </section>
}
