import { z } from 'zod'
import type { LeanCanvas } from './types'

export const sectionIds = [
  'problem', 'alternatives', 'solution', 'metrics', 'value', 'concept',
  'advantage', 'channels', 'segments', 'adopters', 'cost', 'revenue',
] as const
const sectionId = z.enum(sectionIds)
const section = z.object({
  id: sectionId,
  number: z.number().int().finite().optional(),
  title: z.string(), hint: z.string(), cards: z.array(z.string()),
}).strict()
const sections = z.array(section).length(12).superRefine((value, context) => {
  if (value.some((item, index) => item.id !== sectionIds[index]))
    context.addIssue({ code: 'custom', message: 'sections must use canonical order' })
})
export const canvasSchema = z.object({
  id: z.string().min(1), name: z.string(), title: z.string(),
  favorite: z.boolean(), notes: z.string(), sections,
}).strict()
const legacyCanvas = canvasSchema.extend({ notes: z.string().default('') }).strict()
const timestamp = z.custom<{ seconds: number; nanoseconds: number }>((value) => {
  if (!value || typeof value !== 'object') return false
  const { seconds, nanoseconds } = value as { seconds?: unknown; nanoseconds?: unknown }
  return typeof seconds === 'number' && Number.isSafeInteger(seconds) &&
    typeof nanoseconds === 'number' && Number.isInteger(nanoseconds) &&
    nanoseconds >= 0 && nanoseconds < 1_000_000_000
}, 'invalid Firestore timestamp')
export const canvasDocumentSchema = canvasSchema.omit({ id: true }).extend({
  schemaVersion: z.literal(1), revision: z.number().int().positive(),
  updatedAt: timestamp, legacyId: z.string().optional(),
}).strict()
export const workspaceSchema = z.object({
  schemaVersion: z.literal(2), canvasOrder: z.array(z.string().min(1)).max(5000),
  orderRevision: z.number().int().positive(), updatedAt: timestamp,
  canvases: z.array(legacyCanvas).optional(),
}).strict().superRefine((value, context) => {
  if (new Set(value.canvasOrder).size !== value.canvasOrder.length)
    context.addIssue({ code: 'custom', message: 'canvasOrder contains duplicates' })
})
export const legacyWorkspaceSchema = z.object({
  canvases: z.array(legacyCanvas), updatedAt: z.unknown().optional(),
}).strict()
export type CanvasDocument = z.infer<typeof canvasDocumentSchema>
export type WorkspaceDocument = z.infer<typeof workspaceSchema>
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }
export function parseResult<T>(schema: z.ZodType<T>, value: unknown): ParseResult<T> {
  const result = schema.safeParse(value)
  if (result.success) return { ok: true, value: result.data }
  const issue = result.error.issues[0]
  return { ok: false, error: `${issue.path.join('.') || 'document'}: ${issue.message}` }
}
export function parseCanvasArray(value: unknown): ParseResult<LeanCanvas[]> {
  return parseResult(z.array(legacyCanvas), value)
}
