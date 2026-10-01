import { useId, useState } from 'react'

export function TicketRunText({ message, summary }: { message: string; summary: string }) {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const text = [message, summary].filter(Boolean).join('\n\n')
  if (!text) return null
  const long = text.length > 240 || text.split('\n').length > 4
  return <div className="ticket-run-text">
    <p id={id} className={`ticket-run-summary${long && !expanded ? ' ticket-run-preview' : ''}`}>
      {long && !expanded ? `${text.slice(0, 240)}…` : text}</p>
    {long && <button type="button" aria-expanded={expanded} aria-controls={id}
      onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show full update'}</button>}
  </div>
}
