import { useContext, useEffect, useRef, useState } from 'react'
import type { BoardCard } from '../../data/board'
import type { TicketRunView } from '../../data/ticket-run'
import { TicketRunContext } from './ticket-run-context'

export function useTicketRun(card: BoardCard) {
  const client = useContext(TicketRunContext)
  const [snapshot, setSnapshot] = useState<{ client: typeof client; cardId: string; view: TicketRunView } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [retry, setRetry] = useState(0)
  const [now, setNow] = useState(Date.now)
  const busy = useRef(false)
  const requestId = useRef<string | null>(null)
  useEffect(() => {
    if (!client) return
    let live = true
    const stop = client.subscribe(card.id, (view) => {
      if (live) { setSnapshot({ client, cardId: card.id, view }); setError(null) }
    }, () => { if (live) setError('Couldn’t load Codex status. Retry to reconnect.') })
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => { live = false; stop(); window.clearInterval(timer) }
  }, [client, card.id, retry])
  const view = snapshot?.client === client && snapshot?.cardId === card.id ? snapshot.view : null
  return { view, now, error, pending, available: !!client, retry: () => setRetry((value) => value + 1),
    async request() {
      if (!client || busy.current) return
      busy.current = true; setPending(true); setError(null)
      requestId.current ??= crypto.randomUUID()
      try { await client.request(card, requestId.current); requestId.current = null }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Couldn’t queue this run. Try again.') }
      finally { busy.current = false; setPending(false) }
    },
  }
}
