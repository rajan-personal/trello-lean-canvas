import { describe, expect, it } from 'vitest'
import {
  canvasDocumentSchema, legacyWorkspaceSchema, parseCanvasArray, workspaceSchema,
} from '../src/data/canvas-schema'
import { canvasPayload } from '../src/data/firestore-model'
import { canvas, timestamp } from './fixtures'

const document = () => ({ schemaVersion: 1, ...canvasPayload(canvas()),
  revision: 1, updatedAt: timestamp })
describe('persisted schemas', () => {
  it('accepts canonical canvas and workspace documents', () => {
    expect(canvasDocumentSchema.safeParse(document()).success).toBe(true)
    expect(workspaceSchema.safeParse({ schemaVersion: 2, canvasOrder: ['canvas-a'],
      orderRevision: 1, updatedAt: timestamp }).success).toBe(true)
  })
  it('rejects malformed, extra, and misordered persisted fields', () => {
    expect(canvasDocumentSchema.safeParse({ ...document(), surprise: true }).success).toBe(false)
    const wrongOrder = document()
    wrongOrder.sections = [...wrongOrder.sections].reverse()
    expect(canvasDocumentSchema.safeParse(wrongOrder).success).toBe(false)
    expect(workspaceSchema.safeParse({ schemaVersion: 2, canvasOrder: ['x', 'x'],
      orderRevision: 1, updatedAt: timestamp }).success).toBe(false)
  })
  it('strictly accepts the deployed legacy shape and defaults notes', () => {
    const legacy = canvas()
    const withoutNotes = { id: legacy.id, name: legacy.name, title: legacy.title,
      favorite: legacy.favorite, sections: legacy.sections }
    const parsed = legacyWorkspaceSchema.safeParse({ canvases: [withoutNotes], updatedAt: timestamp })
    expect(parsed.success && parsed.data.canvases[0].notes).toBe('')
    expect(legacyWorkspaceSchema.safeParse({ canvases: [legacy], extra: true }).success).toBe(false)
  })
  it('rejects invalid local arrays rather than partially accepting them', () => {
    expect(parseCanvasArray([canvas(), { ...canvas('bad'), favorite: 'yes' }]).ok).toBe(false)
  })
})
