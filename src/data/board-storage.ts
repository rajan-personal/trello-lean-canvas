import { parseCanvasArray } from './canvas-schema'
import { boardDataSchema, type BoardData } from './board'
import type { LeanCanvas } from './types'

const LOCAL_KEY = 'lean-canvas:boards:v1'
export const LOCAL_BOARD_EVENT = 'lean-canvas-board-change'
export interface PendingImport { canvas: LeanCanvas; board: BoardData; importId: string }
export function readLocalBoards(storage: Storage = globalThis.localStorage): Record<string, BoardData> {
  const raw: unknown = JSON.parse(storage.getItem(LOCAL_KEY) ?? '{}')
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid local board storage.')
  return Object.fromEntries(Object.entries(raw).map(([id, value]) => [id, boardDataSchema.parse(value)]))
}
export function readPendingImports(storage: Storage, pendingKey: string): PendingImport[] {
    const raw: unknown = JSON.parse(storage.getItem(pendingKey) ?? '[]')
    if (!Array.isArray(raw)) throw new Error('Invalid pending board imports.')
    return raw.map((entry: PendingImport) => {
      const canvas = parseCanvasArray([entry.canvas])
      if (!canvas.ok || typeof entry.importId !== 'string' || !entry.importId)
        throw new Error('Invalid pending board import.')
      return { canvas: canvas.value[0], board: boardDataSchema.parse(entry.board), importId: entry.importId }
    })
}
export function stageBoardImport(storage: Storage, pendingKey: string, canvas: LeanCanvas, board: BoardData, importId: string = crypto.randomUUID()) {
      const pending = readPendingImports(storage, pendingKey)
      if (pending.some((entry) => entry.canvas.id === canvas.id))
        throw new Error('An import is already pending for this canvas. Retry synchronization.')
      storage.setItem(pendingKey, JSON.stringify([...pending,
        { canvas, board: boardDataSchema.parse(board), importId }]))
}
export function writeLocalBoards(storage: Storage, boards: Record<string, BoardData>) {
  storage.setItem(LOCAL_KEY, JSON.stringify(boards))
  globalThis.dispatchEvent?.(new Event(LOCAL_BOARD_EVENT))
}
