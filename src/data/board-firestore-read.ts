import { collection, doc, getDocFromServer, getDocsFromServer, type Firestore } from 'firebase/firestore'
import { boardCardSchema, boardCommentSchema, boardDataSchema, type BoardData } from './board'
import { boardPath, boardRecordSchema } from './board-firestore-model'
import { finishCardDeletion } from './board-firestore-delete'

async function readRecord(db: Firestore, uid: string, canvasId: string) {
  const snapshot = await getDocFromServer(doc(db, boardPath(uid, canvasId)))
  if (!snapshot.exists()) throw new Error('Board does not exist.')
  const value = boardRecordSchema.parse(snapshot.data())
  if (value.canvasId !== canvasId) throw new Error('Board belongs to a different canvas.')
  return value
}

export async function readBoard(db: Firestore, uid: string, canvasId: string): Promise<{ data: BoardData; revision: number }> {
  // Every writer changes the board revision. The sandwich rejects mixed collection snapshots.
  for (let attempt = 0; attempt < 4; attempt++) {
    const before = await readRecord(db, uid, canvasId)
    if (before.status === 'deleting-card') {
      await finishCardDeletion(db, uid, canvasId, before.deletingCardId)
      continue
    }
    if (before.status !== 'active') throw new Error(`Board is ${before.status}; retry after recovery.`)
    const path = boardPath(uid, canvasId)
    const [cards, comments] = await Promise.all([
      getDocsFromServer(collection(db, `${path}/cards`)),
      getDocsFromServer(collection(db, `${path}/comments`)),
    ])
    const after = await readRecord(db, uid, canvasId)
    if (before.revision !== after.revision) continue
    const decode = (value: Record<string, unknown>, id: string) => {
      if (value.canvasId !== canvasId || value.schemaVersion !== 1)
        throw new Error('Invalid board record linkage.')
      const { canvasId: _canvasId, schemaVersion: _version, updatedAt: _time, ...data } = value
      void _canvasId; void _version; void _time
      return { ...data, id }
    }
    return { revision: after.revision, data: boardDataSchema.parse({
      columns: after.columns,
      cards: cards.docs.map((item) => boardCardSchema.parse(decode(item.data(), item.id))),
      comments: comments.docs.map((item) => boardCommentSchema.parse(decode(item.data(), item.id))),
    }) }
  }
  throw new Error('Board changed while loading. Please retry.')
}
