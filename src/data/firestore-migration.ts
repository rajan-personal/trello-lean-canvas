import {
  doc, getDocFromServer, runTransaction, serverTimestamp, type Firestore,
} from 'firebase/firestore'
import { legacyWorkspaceSchema, parseResult, workspaceSchema } from './canvas-schema'
import {
  canvasPayload, canvasesPath, decodeCanvas, equalCanvas, isLegacy,
  migrationCanvases, workspacePath,
} from './firestore-model'
import type { LeanCanvas } from './types'

const CHUNK_SIZE = 400
const sameSource = (data: unknown, source: string | null) =>
  source === null ? data === undefined : isLegacy(data as Record<string, unknown>) &&
    JSON.stringify((data as { canvases: unknown }).canvases) === source

async function copyChildren(
  db: Firestore, uid: string, canvases: LeanCanvas[], source: string | null,
) {
  const parent = doc(db, workspacePath(uid))
  for (let start = 0; start < canvases.length; start += CHUNK_SIZE) {
    const chunk = canvases.slice(start, start + CHUNK_SIZE)
    await runTransaction(db, async (transaction) => {
      const current = await transaction.get(parent)
      if (!sameSource(current.data(), source)) throw new Error('Migration source changed; retry.')
      const snapshots = await Promise.all(chunk.map((canvas) =>
        transaction.get(doc(db, canvasesPath(uid), canvas.id))))
      chunk.forEach((canvas, index) => {
        const existing = snapshots[index]
        if (existing.exists()) {
          if (!equalCanvas(decodeCanvas(existing.id, existing.data()).canvas, canvas))
            throw new Error(`Migration found conflicting canvas ${canvas.id}.`)
          return
        }
        transaction.set(existing.ref, { schemaVersion: 1, ...canvasPayload(canvas),
          revision: 1, updatedAt: serverTimestamp() })
      })
    })
  }
}
async function childrenMatch(db: Firestore, uid: string, canvases: LeanCanvas[]) {
  for (const expected of canvases) {
    const snapshot = await getDocFromServer(doc(db, canvasesPath(uid), expected.id))
    if (!snapshot.exists()) return false
    if (!equalCanvas(decodeCanvas(snapshot.id, snapshot.data()).canvas, expected)) return false
  }
  return true
}
async function finalize(
  db: Firestore, uid: string, canvases: LeanCanvas[], source: string | null,
) {
  await runTransaction(db, async (transaction) => {
    const parent = doc(db, workspacePath(uid))
    const current = await transaction.get(parent)
    if (!sameSource(current.data(), source)) {
      const parsed = parseResult(workspaceSchema, current.data())
      const expectedOrder = canvases.map(({ id }) => id)
      if (parsed.ok && JSON.stringify(parsed.value.canvasOrder) === JSON.stringify(expectedOrder))
        return
      throw new Error('Migration source changed; retry.')
    }
    transaction.set(parent, { schemaVersion: 2, canvasOrder: canvases.map(({ id }) => id),
      orderRevision: 1, updatedAt: serverTimestamp(), canvases })
  })
}
export async function initializeWorkspace(
  db: Firestore, uid: string, localCanvases: LeanCanvas[],
): Promise<{ consumedLocal: boolean }> {
  const snapshot = await getDocFromServer(doc(db, workspacePath(uid)))
  const data = snapshot.data()
  if (snapshot.exists() && !isLegacy(data)) {
    const parsed = parseResult(workspaceSchema, data)
    if (!parsed.ok) throw new Error(`Invalid workspace: ${parsed.error}`)
    const migrated = await migrationCanvases(localCanvases)
    const sameOrder = JSON.stringify(parsed.value.canvasOrder) ===
      JSON.stringify(migrated.map(({ id }) => id))
    return { consumedLocal: migrated.length > 0 && sameOrder &&
      await childrenMatch(db, uid, migrated) }
  }
  let sourceCanvases = localCanvases
  let source: string | null = null
  if (snapshot.exists()) {
    const parsed = parseResult(legacyWorkspaceSchema, data)
    if (!parsed.ok) throw new Error(`Legacy migration stopped: ${parsed.error}`)
    sourceCanvases = parsed.value.canvases
    source = JSON.stringify((data as { canvases: unknown }).canvases)
  }
  const migrated = await migrationCanvases(sourceCanvases)
  await copyChildren(db, uid, migrated, source)
  if (!await childrenMatch(db, uid, migrated)) throw new Error('Migration verification failed.')
  await finalize(db, uid, migrated, source)
  return { consumedLocal: !snapshot.exists() && localCanvases.length > 0 }
}
