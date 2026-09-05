import {
  collection, doc, getFirestore, onSnapshot, type Unsubscribe,
} from 'firebase/firestore'
import { firebaseApp } from '../firebase'
import { parseResult, workspaceSchema } from './canvas-schema'
import { initializeWorkspace } from './firestore-migration'
import { canvasesPath, decodeCanvas, workspacePath, type WorkspaceValue } from './firestore-model'
import { saveCanvasDiff } from './firestore-writes'
import type { BoardData } from './board'
import type { PendingImport } from './board-storage'
import type { LeanCanvas } from './types'

const db = getFirestore(firebaseApp)
export async function prepareWorkspace(uid: string, local: LeanCanvas[], localBoards: Record<string, BoardData> = {}) {
  return initializeWorkspace(db, uid, local, localBoards)
}
export function subscribeToWorkspace(
  uid: string, onValue: (value: WorkspaceValue) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  let workspace: ReturnType<typeof workspaceSchema.parse> | undefined
  const children = new Map<string, ReturnType<typeof decodeCanvas>>()
  let parentReady = false
  let childrenReady = false
  const publish = () => {
    if (!parentReady || !childrenReady || !workspace) return
    try {
      const ordered = workspace.canvasOrder.map((id) => {
        const item = children.get(id)
        if (!item) throw new Error(`Canvas ${id} is missing from the workspace.`)
        return item
      })
      onValue({ canvases: ordered.map(({ canvas }) => canvas),
        revisions: Object.fromEntries(ordered.map(({ canvas, revision }) => [canvas.id, revision])),
        orderRevision: workspace.orderRevision })
    } catch (error) { onError(error instanceof Error ? error : new Error('Invalid workspace.')) }
  }
  const stopParent = onSnapshot(doc(db, workspacePath(uid)), (snapshot) => {
    const parsed = parseResult(workspaceSchema, snapshot.data())
    parentReady = true
    if (!parsed.ok) { onError(new Error(`Invalid workspace: ${parsed.error}`)); return }
    workspace = parsed.value
    publish()
  }, onError)
  const stopChildren = onSnapshot(collection(db, canvasesPath(uid)), (snapshot) => {
    const next = new Map<string, ReturnType<typeof decodeCanvas>>()
    try {
      snapshot.docs.forEach((item) => next.set(item.id, decodeCanvas(item.id, item.data())))
    } catch (error) { onError(error instanceof Error ? error : new Error('Invalid canvas.')); return }
    children.clear()
    next.forEach((value, key) => children.set(key, value))
    childrenReady = true
    publish()
  }, onError)
  return () => { stopParent(); stopChildren() }
}
export function saveWorkspaceDiff(
  uid: string, previous: WorkspaceValue, next: LeanCanvas[], imports: PendingImport[] = [],
): Promise<WorkspaceValue> {
  return saveCanvasDiff(db, uid, previous, next, imports)
}
