import { z } from 'zod'
import { canvasSchema } from '../src/data/canvas-schema'
import { boardCardSchema, boardCommentSchema, boardDataSchema } from '../src/data/board'
import { safeCanvasId } from '../src/data/persistence-types'
export const recordId = z.string().refine(safeCanvasId)
export const canvasInput = canvasSchema.extend({
  id: recordId, name: z.string().max(500), title: z.string().max(500), notes: z.string().max(100000),
})
export const commentInput = boardCommentSchema
const base = { id: recordId }
const column = { columnId: recordId }
export const commandSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('create-column'), ...base, title: z.string().trim().min(1).max(500) }),
  z.strictObject({ type: z.literal('rename-column'), ...base, title: z.string().trim().min(1).max(500) }),
  z.strictObject({ type: z.literal('move-column'), ...base, index: z.number().int() }),
  z.strictObject({ type: z.literal('delete-column'), ...base }),
  z.strictObject({ type: z.literal('create-card'), ...base, ...column,
    title: z.string().trim().min(1).max(500), parentTicketId: recordId.nullable().optional() }),
  z.strictObject({ type: z.literal('edit-card'), ...base, ...column,
    title: z.string().trim().min(1).max(500), description: z.string().max(100000),
    storyPoints: boardCardSchema.shape.storyPoints,
    expected: boardCardSchema.pick({ title: true, description: true, columnId: true, storyPoints: true }).strip() }),
  z.strictObject({ type: z.literal('move-card'), ...base, ...column, index: z.number().int() }),
  z.strictObject({ type: z.literal('delete-card'), ...base }),
  z.strictObject({ type: z.literal('add-comment'), comment: commentInput }),
])
export const pendingImportSchema = z.strictObject({ canvas: canvasInput, board: boardDataSchema, importId: z.string().min(1).max(200) })
export const workspaceInput = z.strictObject({
  previous: z.strictObject({ canvases: z.array(canvasInput).max(5000),
    revisions: z.record(z.string(), z.number().int().positive()), orderRevision: z.number().int().positive() }),
  next: z.array(canvasInput).max(5000), imports: z.array(pendingImportSchema).max(5000).default([]),
})
export const commandInput = z.strictObject({
  command: commandSchema, revision: z.number().int().positive().optional(),
})
