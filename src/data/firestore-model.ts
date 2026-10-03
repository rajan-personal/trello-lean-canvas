import type { DocumentData } from 'firebase/firestore'
import { canvasDocumentSchema, parseResult } from './canvas-schema'
import type { LeanCanvas } from './types'

export interface RevisionedCanvas { canvas: LeanCanvas; revision: number }
export type { WorkspaceValue } from './persistence-types'
export { equalCanvas, safeCanvasId } from './persistence-types'
export const workspacePath = (uid: string) =>
  `users/${uid}/workspaces/default`
export const canvasesPath = (uid: string) =>
  `${workspacePath(uid)}/canvases`
// Omit empty aboutTabs so documents stay readable by clients built before About tabs existed.
export function canvasPayload(canvas: LeanCanvas) {
  return { name: canvas.name, title: canvas.title, favorite: canvas.favorite,
    notes: canvas.notes, about: canvas.about, ...(canvas.aboutTabs.length ? { aboutTabs: canvas.aboutTabs } : {}),
    sections: canvas.sections }
}
export function decodeCanvas(id: string, data: unknown): RevisionedCanvas {
  const parsed = parseResult(canvasDocumentSchema, data)
  if (!parsed.ok) throw new Error(`Invalid canvas ${id}: ${parsed.error}`)
  const value = parsed.value
  const canvas = { id, name: value.name, title: value.title, favorite: value.favorite,
    notes: value.notes, about: value.about, aboutTabs: value.aboutTabs, sections: value.sections }
  return { canvas, revision: value.revision }
}
export { migrationCanvases } from './migration-ids'
export function isLegacy(data: DocumentData | undefined): data is DocumentData & { canvases: unknown } {
  return !!data && Array.isArray(data.canvases) && data.schemaVersion === undefined
}
