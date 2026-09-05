import { doc, type Firestore, type Transaction } from 'firebase/firestore'
import { boardDataSchema } from './board'
import { boardPath, boardRecord, boardRecordSchema } from './board-firestore-model'
import type { PendingImport } from './board-storage'

/** Read before canvas writes; publish the import identity in the same transaction. */
export async function prepareImportReservations(db: Firestore, uid: string, tx: Transaction, imports: PendingImport[]) {
  const reservations = await Promise.all(imports.map(async ({ canvas, board, importId }) => {
    const data = boardDataSchema.parse(board)
    const ref = doc(db, boardPath(uid, canvas.id))
    const snapshot = await tx.get(ref)
    if (snapshot.exists()) {
      const current = boardRecordSchema.parse(snapshot.data())
      if (current.importId !== importId || !['active', 'importing'].includes(current.status))
        throw new Error('A different board already exists for this canvas.')
      return null
    }
    return { ref, record: boardRecord(canvas.id, data, 'importing', importId) }
  }))
  return () => reservations.forEach((entry) => { if (entry) tx.set(entry.ref, entry.record) })
}
