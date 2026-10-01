import { Bot, ExternalLink } from 'lucide-react'
import type { BoardCard } from '../../data/board'
import { activeRun, runLabels, safePullRequestUrl, safeWorkUrl } from '../../data/ticket-run'
import { useTicketRun } from './useTicketRun'
import { TicketRunText } from './TicketRunText'
import './ticket-run.css'

export function TicketRunPanel({ card, disabled, dirty, changedElsewhere = false }: { card: BoardCard; disabled: boolean; dirty: boolean; changedElsewhere?: boolean }) {
  const state = useTicketRun(card)
  if (!state.available) return null
  const run = state.view?.run ?? null
  const active = activeRun(run)
  const connected = !!state.view && state.view.connectedUntil > state.now
  const stale = active && run && state.now - run.updatedAt > 10 * 60 * 1000
  const url = run && safePullRequestUrl(run.prUrl)
  const workUrl = safeWorkUrl(run?.workUrl)
  const unavailable = disabled || state.pending || !state.view || state.view.fromCache || !!state.error
  const hint = changedElsewhere ? 'This ticket changed elsewhere. Copy any draft, then close and reopen to review before running.' : dirty ? 'Save your changes before running Codex.' : !state.view ? 'Loading…' :
    state.view.fromCache ? 'Reconnecting… Showing the last saved update.' :
    !connected ? 'Connect Lean in Work to run this ticket.' :
    run?.status === 'queued' ? 'Waiting for Work to pick up this ticket.' : ''
  return <section className="ticket-run" aria-label="Codex">
    <div className="ticket-run-heading">
      <h3><Bot size={17} aria-hidden="true" /> Codex</h3>
      <button type="button" disabled={unavailable || dirty || changedElsewhere || active || !connected}
        onClick={() => void state.request()}>{state.pending ? (active ? 'Requesting stop…' : 'Queuing…') : active ? runLabels[run!.status] : run ? 'Run again' : 'Run Codex'}</button>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">
      {run && <p className="ticket-run-status"><span className="ticket-run-dot" data-status={run.status} />
        {runLabels[run.status]}<time dateTime={new Date(run.updatedAt).toISOString()} title={new Date(run.updatedAt).toLocaleString()}>
          Updated {new Date(run.updatedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time></p>}
      {stale && <p className="ticket-run-hint">No recent update. Check the run in Work.</p>}
      {hint && <p className="ticket-run-hint">{hint}</p>}
    </div>
    {url && <a href={url} target="_blank" rel="noopener noreferrer">View pull request <ExternalLink size={14} aria-hidden="true" /></a>}
    {workUrl && <a href={workUrl} target="_blank" rel="noopener noreferrer">Open in Work <ExternalLink size={14} aria-hidden="true" /></a>}
    {run?.status === 'blocked' && <p className="ticket-run-hint">Answer in Work to continue, or request a stop.</p>}
    {run && active && <div className="ticket-run-recovery">
      <button type="button" disabled={unavailable || run.stopRequestedAt !== undefined} onClick={() => {
        if (window.confirm('Request this run to stop? A new run stays disabled until Work confirms it has stopped.')) void state.requestStop()
      }}>{run.stopRequestedAt !== undefined ? 'Stop requested' : 'Request stop'}</button>
      {run.stopRequestedAt !== undefined && <p className="ticket-run-hint">Waiting for confirmation from Work. This does not stop execution immediately.</p>}
      {!workUrl && <p className="ticket-run-hint">Open the subscribed Lean conversation in Work to check or answer this run.</p>}
    </div>}
    {run && <TicketRunText key={run.runId} message={run.message} summary={run.summary} />}
    {state.error && <p role="alert" className="ticket-run-error">{state.error} <button type="button" onClick={state.retry}>Retry</button></p>}
  </section>
}
