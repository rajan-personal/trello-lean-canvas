import { doc, onSnapshot, runTransaction, serverTimestamp, Timestamp, type Firestore } from 'firebase/firestore'
import { boardPath } from './board-firestore-model'
import { safeCanvasId } from './firestore-model'
import { activeRun, ticketRunSchema, type TicketRunClient, type TicketRun } from './ticket-run'

function decode(data: Record<string, unknown>): TicketRun {
  return ticketRunSchema.parse({ ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : undefined,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : undefined,
  })
}
export function createTicketRunClient(db: Firestore, uid: string, canvasId: string): TicketRunClient {
  const path = boardPath(uid, canvasId)
  const connection = doc(db, `${path}/integrations/codex`)
  const runRef = (id: string) => {
    if (!safeCanvasId(id)) throw new Error('Invalid ticket.')
    return doc(db, `${path}/codexRuns`, id)
  }
  return {
    subscribe(cardId, changed, error) {
      let run: TicketRun | null = null, connectedUntil = 0
      let runReady = false, connectionReady = false, runCached = true, connectionCached = true
      const emit = () => {
        if (runReady && connectionReady) changed({ run, connectedUntil, fromCache: runCached || connectionCached })
      }
      const stopConnection = onSnapshot(connection, { includeMetadataChanges: true }, (snapshot) => {
        const data = snapshot.data()
        connectedUntil = data?.enabled === true && data?.expiresAt instanceof Timestamp ? data.expiresAt.toMillis() : 0
        connectionCached = snapshot.metadata.fromCache
        connectionReady = true; emit()
      }, error)
      const stopRun = onSnapshot(runRef(cardId), { includeMetadataChanges: true }, (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return
        try {
          run = snapshot.exists() ? decode(snapshot.data()) : null
          if (run && run.cardId !== cardId) throw new Error('Run belongs to another ticket.')
          runCached = snapshot.metadata.fromCache
          runReady = true; emit()
        } catch { error() }
      }, error)
      return () => { stopConnection(); stopRun() }
    },
    async request(card, runId) {
      const ref = runRef(card.id)
      await runTransaction(db, async (tx) => {
        const [existing, integration, ticket, board] = await Promise.all([
          tx.get(ref), tx.get(connection), tx.get(doc(db, `${path}/cards`, card.id)), tx.get(doc(db, path)),
        ])
        if (existing.exists()) {
          const previous = decode(existing.data())
          if (previous.runId === runId || activeRun(previous)) return
        }
        const config = integration.data()
        if (!config?.enabled || !(config.expiresAt instanceof Timestamp) || config.expiresAt.toMillis() <= Date.now())
          throw new Error('Connect Lean in Work before running this ticket.')
        if (!ticket.exists() || board.data()?.status !== 'active') throw new Error('This ticket is unavailable.')
        if (ticket.data()?.title !== card.title || ticket.data()?.description !== card.description)
          throw new Error('The ticket changed. Reload it before running Codex.')
        const value = ticketRunSchema.parse({ runId, cardId: card.id, requestedBy: uid,
          title: card.title, description: card.description, status: 'queued',
          message: '', summary: '', prUrl: '', createdAt: 0, updatedAt: 0 })
        tx.set(ref, { ...value, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      })
    },
  }
}
