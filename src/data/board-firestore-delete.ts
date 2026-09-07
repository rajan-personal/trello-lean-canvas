import { collection, doc, getDocsFromServer, limit, query, runTransaction, serverTimestamp, where, writeBatch, type Firestore } from 'firebase/firestore'
import { createBoard } from './board'
import { boardPath, boardRecordSchema, boardRecord } from './board-firestore-model'

// Chunked deletes are safe only behind a durable tombstone; every child write rule checks it.
async function drain(db: Firestore, path: string, cardId?: string): Promise<void> {
  const target = query(collection(db, path), ...(cardId ? [where('cardId', '==', cardId)] : []), limit(200))
  for (;;) {
    const snapshots = await getDocsFromServer(target)
    if (snapshots.empty) return
    const batch = writeBatch(db)
    snapshots.docs.forEach((item) => batch.delete(item.ref))
    await batch.commit()
    if (snapshots.size < 200) return
  }
}
export async function startCardDeletion(db: Firestore, uid: string, canvasId: string, cardId: string) {
  const path = boardPath(uid, canvasId)
  await runTransaction(db, async (tx) => {
    const ref = doc(db, path)
    const current = boardRecordSchema.parse((await tx.get(ref)).data())
    const card = await tx.get(doc(db, `${path}/cards`, cardId))
    if (current.status === 'deleting-card' && current.deletingCardId === cardId) return
    if (current.status !== 'active') throw new Error('Board is busy; retry after recovery.')
    if (!card.exists()) return
    tx.update(ref, { status: 'deleting-card', deletingCardId: cardId,
      revision: current.revision + 1, updatedAt: serverTimestamp() })
  })
}
export async function finishCardDeletion(db: Firestore, uid: string, canvasId: string, cardId: string) {
  const path = boardPath(uid, canvasId)
  await drain(db, `${path}/comments`, cardId)
  await runTransaction(db, async (tx) => {
    const ref = doc(db, path)
    const current = boardRecordSchema.parse((await tx.get(ref)).data())
    if (current.status === 'active') return
    if (current.status !== 'deleting-card' || current.deletingCardId !== cardId)
      throw new Error('Board deletion state changed; retry.')
    tx.delete(doc(db, `${path}/cards`, cardId))
    tx.update(ref, { status: 'active', deletingCardId: '', revision: current.revision + 1, updatedAt: serverTimestamp() })
  })
}
export async function prepareBoardDeletion(db: Firestore, uid: string, canvasId: string): Promise<void> {
  const path = boardPath(uid, canvasId)
  await runTransaction(db, async (tx) => {
    const ref = doc(db, path)
    const current = await tx.get(ref)
    if (!current.exists()) {
      // Even old canvases need a tombstone to prevent concurrent initialization.
      tx.set(ref, boardRecord(canvasId, createBoard(), 'deleting'))
      return
    }
    const data = boardRecordSchema.parse(current.data())
    if (data.status !== 'deleting') tx.update(ref, { status: 'deleting',
      revision: data.revision + 1, updatedAt: serverTimestamp() })
  })
  await drain(db, `${path}/comments`)
  await drain(db, `${path}/cards`)
  // Caller atomically removes this tombstone with the canvas, never before it.
}
