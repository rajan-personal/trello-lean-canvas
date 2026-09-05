import { doc, getDocFromServer, onSnapshot, runTransaction, type Firestore } from 'firebase/firestore'
import { createBoard } from './board'
import { canvasesPath } from './firestore-model'
import { boardPath, boardRecord, boardRecordSchema } from './board-firestore-model'
export { boardPath } from './board-firestore-model'
export { readBoard } from './board-firestore-read'
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

export function subscribeBoard(db: Firestore, uid: string, canvasId: string, changed: () => void, error: (cause: Error) => void) {
  return onSnapshot(doc(db, boardPath(uid, canvasId)), () => changed(), error)
}

export async function deletingBoardIds(db: Firestore, uid: string, canvasIds: string[]): Promise<string[]> {
  const values = await Promise.all(canvasIds.map(async (id) => {
    const value = await getDocFromServer(doc(db, boardPath(uid, id)))
    return value.exists() && boardRecordSchema.parse(value.data()).status === 'deleting' ? [id] : []
  }))
  return values.flat()
}
