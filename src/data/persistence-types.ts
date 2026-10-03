import type { LeanCanvas } from './types'
import type { BoardData, BoardSummary } from './board'
export type Persistence = 'local' | 'firestore' | 'postgres'
export interface WorkspaceValue {
  canvases: LeanCanvas[]
  revisions: Record<string, number>
  orderRevision: number
}
export interface BoardSnapshot { data: BoardData; revision: number }
export interface BoardSummarySnapshot { data: BoardSummary; revision: number }
export const equalCanvas = (left: LeanCanvas | undefined, right: LeanCanvas) =>
  !!left && JSON.stringify(left) === JSON.stringify(right)
export function safeCanvasId(id: string): boolean {
  return id.length > 0 && id !== '.' && id !== '..' && !id.includes('/') &&
    new TextEncoder().encode(id).length <= 1500
}
export const productionPersistence = (): 'firestore' | 'postgres' =>
  import.meta.env.VITE_DATA_BACKEND === 'postgres' ? 'postgres' : 'firestore'

