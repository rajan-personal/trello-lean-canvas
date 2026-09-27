import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore'
import { applyBoardCommand, type BoardCommand } from './board-mutations'
import { boardPath, boardRecordSchema, childPayload } from './board-firestore-model'
import { readBoard, type BoardSnapshot } from './board-firestore-read'
import { startCardDeletion, finishCardDeletion } from './board-firestore-delete'
import { appendBoardComment } from './board-firestore-comments'
import { recordTicketActivity } from './board-activity'

export async function mutateBoard(
  db: Firestore, uid: string, canvasId: string, command: BoardCommand, baseline?: BoardSnapshot,
): Promise<BoardSnapshot | undefined> {
  if (command.type === 'delete-card') {
    await startCardDeletion(db, uid, canvasId, command.id)
    await finishCardDeletion(db, uid, canvasId, command.id)
    return
  }
  if (command.type === 'add-comment') {
    await appendBoardComment(db, uid, canvasId, command.comment)
    return // Invalidate the cached snapshot: other writers may have appended too.
  }
  const source = baseline ?? await readBoard(db, uid, canvasId)
  const next = recordTicketActivity(source.data, applyBoardCommand(source.data, command))
  const path = boardPath(uid, canvasId)
  await runTransaction(db, async (tx) => {
    const ref = doc(db, path)
    const current = boardRecordSchema.parse((await tx.get(ref)).data())
    if (current.status !== 'active' || current.revision !== source.revision)
      throw new Error('Board changed in another session. Reload and retry your change.')
    tx.update(ref, { columns: next.columns, revision: current.revision + 1, updatedAt: serverTimestamp(),
      ...(next.activity ? { activity: next.activity } : {}) })
    for (const kind of ['cards', 'comments'] as const) {
      const previous = new Map(source.data[kind].map((item) => [item.id, JSON.stringify(item)]))
      for (const item of next[kind]) {
        if (previous.get(item.id) !== JSON.stringify(item))
          tx.set(doc(db, `${path}/${kind}`, item.id), childPayload(item, canvasId))
      }
    }
  })
  return { data: next, revision: source.revision + 1 }
}
