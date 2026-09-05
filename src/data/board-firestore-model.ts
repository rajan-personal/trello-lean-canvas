import { z } from 'zod'
import { serverTimestamp } from 'firebase/firestore'
import { boardColumnSchema, type BoardData } from './board'
import { canvasesPath, safeCanvasId } from './firestore-model'

export const boardPath = (uid: string, canvasId: string) => {
  if (!safeCanvasId(canvasId)) throw new Error('Unsafe canvas id.')
  return `${canvasesPath(uid)}/${canvasId}/boards/default`
}
export const boardRecordSchema = z.strictObject({
  schemaVersion: z.literal(1), canvasId: z.string(), revision: z.number().int().positive(),
  columns: z.array(boardColumnSchema).max(100),
  status: z.enum(['active', 'importing', 'deleting', 'deleting-card']),
  importId: z.string(), deletingCardId: z.string(), updatedAt: z.unknown(),
})
type BoardRecord = z.infer<typeof boardRecordSchema>
export const boardRecord = (canvasId: string, data: BoardData, status: BoardRecord['status'] = 'active', importId = '') => ({
  schemaVersion: 1, canvasId, revision: 1, columns: data.columns, status, importId,
  deletingCardId: '', updatedAt: serverTimestamp(),
})
export function childPayload(value: { id: string }, canvasId: string) {
  const { id: _id, ...data } = value
  void _id
  return { ...data, schemaVersion: 1, canvasId, updatedAt: serverTimestamp() }
}
