import { useMemo, type ReactNode } from 'react'
import { getFirestore } from 'firebase/firestore'
import { firebaseApp } from '../../firebase'
import { createTicketRunClient } from '../../data/ticket-run-firestore'
import { TicketRunContext } from './ticket-run-context'

export function TicketRunProvider({ uid, canvasId, local, children }: {
  uid: string; canvasId?: string; local: boolean; children: ReactNode
}) {
  const client = useMemo(() => canvasId && !local
    ? createTicketRunClient(getFirestore(firebaseApp), uid, canvasId) : null, [uid, canvasId, local])
  return <TicketRunContext value={client}>{children}</TicketRunContext>
}
