import { equalCanvas, type WorkspaceValue } from './firestore-model'
import type { LeanCanvas } from './types'

export interface ReconcileResult {
  value: WorkspaceValue
  canvases: LeanCanvas[]
  conflictedIds: string[]
}
const canvasIds = (canvases: LeanCanvas[]) => canvases.map(({ id }) => id)
const sameOrder = (left: LeanCanvas[], right: LeanCanvas[]) =>
  JSON.stringify(canvasIds(left)) === JSON.stringify(canvasIds(right))
export function acceptSaveResult(
  current: WorkspaceValue, used: WorkspaceValue, saved: WorkspaceValue,
): WorkspaceValue {
  return current === used ? saved : current
}

export function reconcileRemote(
  base: WorkspaceValue, local: LeanCanvas[], remote: WorkspaceValue,
): ReconcileResult {
  const baseById = new Map(base.canvases.map((canvas) => [canvas.id, canvas]))
  const localById = new Map(local.map((canvas) => [canvas.id, canvas]))
  const remoteById = new Map(remote.canvases.map((canvas) => [canvas.id, canvas]))
  const dirty = new Set<string>()
  base.canvases.forEach((canvas) => {
    const value = localById.get(canvas.id)
    if (!value || !equalCanvas(canvas, value)) dirty.add(canvas.id)
  })
  local.forEach((canvas) => {
    if (!baseById.has(canvas.id)) dirty.add(canvas.id)
  })
  const conflictedIds = [...dirty].filter((id) => {
    const original = baseById.get(id)
    const incoming = remoteById.get(id)
    const pending = localById.get(id)
    const remoteChanged = (!original && !!incoming) ||
      (!!original && (!incoming || !equalCanvas(original, incoming)))
    return remoteChanged && !(incoming && pending && equalCanvas(incoming, pending))
  })
  const orderDirty = !sameOrder(base.canvases, local)
  if (orderDirty && remote.orderRevision !== base.orderRevision)
    conflictedIds.push('__order__')
  const orderedIds = orderDirty ? canvasIds(local) : canvasIds(remote.canvases)
  if (orderDirty) {
    remote.canvases.forEach(({ id }) => {
      if (!localById.has(id) && !baseById.has(id)) orderedIds.push(id)
    })
  }
  const canvases = orderedIds.flatMap((id) => {
    if (dirty.has(id)) return localById.has(id) ? [localById.get(id)!] : []
    const value = remoteById.get(id) ?? localById.get(id)
    return value ? [value] : []
  })
  return { value: remote, canvases, conflictedIds }
}
