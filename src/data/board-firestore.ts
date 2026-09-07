import { doc, getDocFromServer, onSnapshot, runTransaction, type Firestore } from 'firebase/firestore'
import { createBoard } from './board'
import type { BoardVersion } from './board-remote-cache'
import { canvasesPath } from './firestore-model'
import { boardPath, boardRecord, boardRecordSchema } from './board-firestore-model'
export { boardPath } from './board-firestore-model'
export { readBoard, readBoardSummary } from './board-firestore-read'
export { mutateBoard } from './board-firestore-writes'
export { prepareBoardDeletion } from './board-firestore-delete'
export { importBoard } from './board-firestore-import'

export async function initializeBoard(db: Firestore, uid: string, canvasId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const parent = await tx.get(doc(db, canvasesPath(uid), canvasId))
    const ref = doc(db, boardPath(uid, canvasId))
    const existing = await tx.get(ref)
    if (!parent.exists()) throw new Error('Save the canvas before creating its board.')
    if (existing.exists()) return
    tx.set(ref, boardRecord(canvasId, createBoard()))
  })
}

export function subscribeBoard(db: Firestore, uid: string, canvasId: string, changed: (version: BoardVersion | undefined) => void, error: (cause: Error) => void) {
  return onSnapshot(doc(db, boardPath(uid, canvasId)), { includeMetadataChanges: true }, (snapshot) => {
    // Ignore optimistic echoes, but request metadata events so the commit acknowledgment is delivered.
    if (snapshot.metadata.hasPendingWrites) return
    try {
      const record = snapshot.exists() ? boardRecordSchema.parse(snapshot.data()) : undefined
      if (record && record.canvasId !== canvasId) throw new Error('Board belongs to a different canvas.')
      changed(record)
    } catch (cause) { error(cause instanceof Error ? cause : new Error('Invalid board.')) }
  }, error)
}

export async function deletingBoardIds(db: Firestore, uid: string, canvasIds: string[]): Promise<string[]> {
  const values = await Promise.all(canvasIds.map(async (id) => {
    const value = await getDocFromServer(doc(db, boardPath(uid, id)))
    return value.exists() && boardRecordSchema.parse(value.data()).status === 'deleting' ? [id] : []
  }))
  return values.flat()
}
