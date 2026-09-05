import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore'
import { parseCanvasArray, parseResult, workspaceSchema } from './canvas-schema'
import {
  canvasPayload, canvasesPath, decodeCanvas, equalCanvas, safeCanvasId,
  workspacePath, type WorkspaceValue,
} from './firestore-model'
import { prepareImportReservations } from './board-import-reservation'
import type { PendingImport } from './board-storage'
import type { LeanCanvas } from './types'
import { boardPath, prepareBoardDeletion } from './board-firestore'

const ids = (canvases: LeanCanvas[]) => canvases.map(({ id }) => id)
function validateNext(canvases: LeanCanvas[]) {
  const parsed = parseCanvasArray(canvases)
  if (!parsed.ok) throw new Error(`Invalid canvas data: ${parsed.error}`)
  if (canvases.some((canvas) => !safeCanvasId(canvas.id)))
    throw new Error('Invalid canvas data: unsafe document id.')
  if (new Set(ids(canvases)).size !== canvases.length)
    throw new Error('Invalid canvas data: duplicate ids.')
}
export async function saveCanvasDiff(
  db: Firestore, uid: string, previous: WorkspaceValue, next: LeanCanvas[], imports: PendingImport[] = [],
): Promise<WorkspaceValue> {
  validateNext(next)
  const previousById = new Map(previous.canvases.map((canvas) => [canvas.id, canvas]))
  const nextById = new Map(next.map((canvas) => [canvas.id, canvas]))
  const changed = next.filter((canvas) => !equalCanvas(previousById.get(canvas.id), canvas))
  const deleted = previous.canvases.filter((canvas) => !nextById.has(canvas.id))
  const orderChanged = JSON.stringify(ids(previous.canvases)) !== JSON.stringify(ids(next))
  const revisions = { ...previous.revisions }
  let orderRevision = previous.orderRevision
  await Promise.all(deleted.map((canvas) => prepareBoardDeletion(db, uid, canvas.id)))
  await runTransaction(db, async (transaction) => {
    const parentRef = doc(db, workspacePath(uid))
    const writes = [...changed, ...deleted]
    const [parentSnapshot, snapshots, reserveImports] = await Promise.all([
      transaction.get(parentRef),
      Promise.all(writes.map((canvas) => transaction.get(doc(db, canvasesPath(uid), canvas.id)))),
      prepareImportReservations(db, uid, transaction, imports.filter(({ canvas }) => nextById.has(canvas.id))),
    ])
    const parent = parseResult(workspaceSchema, parentSnapshot.data())
    if (!parent.ok) throw new Error(`Invalid workspace: ${parent.error}`)
    orderRevision = parent.value.orderRevision
    reserveImports()
    changed.forEach((canvas, index) => {
      const snapshot = snapshots[index]
      const revision = snapshot.exists() ? decodeCanvas(snapshot.id, snapshot.data()).revision + 1 : 1
      revisions[canvas.id] = revision
      transaction.set(snapshot.ref, { schemaVersion: 1, ...canvasPayload(canvas), revision,
        updatedAt: serverTimestamp() })
    })
    deleted.forEach((canvas, index) => {
      const snapshot = snapshots[changed.length + index]
      if (snapshot.exists()) {
        decodeCanvas(snapshot.id, snapshot.data())
        transaction.delete(snapshot.ref)
        transaction.delete(doc(db, boardPath(uid, canvas.id)))
      }
      delete revisions[canvas.id]
    })
    if (orderChanged) {
      orderRevision += 1
      transaction.set(parentRef, { schemaVersion: 2, canvasOrder: ids(next),
        orderRevision, updatedAt: serverTimestamp() }, { merge: true })
    }
  })
  return { canvases: next, revisions, orderRevision }
}
