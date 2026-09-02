import type { DocumentData } from 'firebase/firestore'
import { canvasDocumentSchema, parseResult } from './canvas-schema'
import type { LeanCanvas } from './types'

export interface RevisionedCanvas { canvas: LeanCanvas; revision: number }
export interface WorkspaceValue {
  canvases: LeanCanvas[]
  revisions: Record<string, number>
  orderRevision: number
}
export const workspacePath = (uid: string) =>
  `users/${uid}/workspaces/default`
export const canvasesPath = (uid: string) =>
  `${workspacePath(uid)}/canvases`
export function canvasPayload(canvas: LeanCanvas) {
  return { name: canvas.name, title: canvas.title, favorite: canvas.favorite,
    notes: canvas.notes, sections: canvas.sections }
}
export function decodeCanvas(id: string, data: unknown): RevisionedCanvas {
  const parsed = parseResult(canvasDocumentSchema, data)
  if (!parsed.ok) throw new Error(`Invalid canvas ${id}: ${parsed.error}`)
  const value = parsed.value
  const canvas = { id, name: value.name, title: value.title, favorite: value.favorite,
    notes: value.notes, sections: value.sections }
  return { canvas, revision: value.revision }
}
export function equalCanvas(left: LeanCanvas | undefined, right: LeanCanvas): boolean {
  return !!left && JSON.stringify(left) === JSON.stringify(right)
}
export function safeCanvasId(id: string): boolean {
  return id.length > 0 && id !== '.' && id !== '..' && !id.includes('/') &&
    new TextEncoder().encode(id).length <= 1500
}
async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
export async function migrationCanvases(canvases: LeanCanvas[]): Promise<LeanCanvas[]> {
  const counts = new Map<string, number>()
  canvases.forEach(({ id }) => counts.set(id, (counts.get(id) ?? 0) + 1))
  return Promise.all(canvases.map(async (canvas, index) => {
    if (safeCanvasId(canvas.id) && counts.get(canvas.id) === 1) return canvas
    const hash = await digest(JSON.stringify([index, canvas]))
    return { ...canvas, id: `migrated-${hash}` }
  }))
}
export function isLegacy(data: DocumentData | undefined): data is DocumentData & { canvases: unknown } {
  return !!data && Array.isArray(data.canvases) && data.schemaVersion === undefined
}
