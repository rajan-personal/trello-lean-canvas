import { doc, runTransaction, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore'
import { boardDataSchema, type BoardData } from './board'
import { hierarchyLayers } from './ticket-hierarchy'
import { canvasesPath } from './firestore-model'
import { boardPath, boardRecordSchema, boardRecord, childPayload } from './board-firestore-model'
import { childCountChange } from './board-firestore-hierarchy'

export async function importBoard(db: Firestore, uid: string, canvasId: string, source: BoardData, importId: string): Promise<void> {
  const data = boardDataSchema.parse(source)
  const path = boardPath(uid, canvasId)
  const complete = await runTransaction(db, async (tx) => {
    const parent = await tx.get(doc(db, canvasesPath(uid), canvasId))
    const ref = doc(db, path)
    const snapshot = await tx.get(ref)
    if (!parent.exists()) throw new Error('Save the canvas before importing its board.')
    if (snapshot.exists()) {
      const current = boardRecordSchema.parse(snapshot.data())
      if (current.importId !== importId || !['active', 'importing'].includes(current.status))
        throw new Error('A different board already exists for this canvas.')
      return current.status === 'active'
    }
    tx.set(ref, boardRecord(canvasId, data, 'importing', importId))
    return false
  })
  if (complete) return
  // Roots/comments retain batched imports. Each nested create updates its parent's
  // guard in one transaction; an interrupted import never double-counts a child.
  const layers = [
    ...hierarchyLayers(data.cards).map((cards) => cards.map((item) => ({ kind: 'cards', item }))),
    data.comments.map((item) => ({ kind: 'comments', item })),
  ]
  // Each comment rule reads its card; stay below the 20-access batch rule limit.
  for (const entries of layers) for (let start = 0; start < entries.length; start += 10) {
    const batch = writeBatch(db)
    let batched = false
    for (const { kind, item } of entries.slice(start, start + 10)) {
      if ('parentTicketId' in item && item.parentTicketId) {
        const parentId = item.parentTicketId
        await runTransaction(db, async (tx) => {
          const board = boardRecordSchema.parse((await tx.get(doc(db, path))).data())
          if (board.importId !== importId || board.status !== 'importing')
            throw new Error('Import state changed. Retry to verify completion.')
          const ref = doc(db, `${path}/cards`, item.id)
          if ((await tx.get(ref)).exists()) return
          const updateChildren = await childCountChange(tx, db, path, parentId, item.id, 1)
          updateChildren()
          tx.set(ref, childPayload(item, canvasId))
        })
      } else {
        batch.set(doc(db, `${path}/${kind}`, item.id), childPayload(item, canvasId))
        batched = true
      }
    }
    if (batched) await batch.commit()
  }
  await runTransaction(db, async (tx) => {
    const ref = doc(db, path)
    const current = boardRecordSchema.parse((await tx.get(ref)).data())
    if (current.importId !== importId || current.status !== 'importing')
      throw new Error('Import state changed. Retry to verify completion.')
    tx.update(ref, { status: 'active', revision: current.revision + 1, updatedAt: serverTimestamp() })
  })
}
