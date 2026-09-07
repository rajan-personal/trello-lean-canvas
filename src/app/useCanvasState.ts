import { type Dispatch, type SetStateAction } from 'react'
import type { LeanCanvas } from '../data/types'
import { usePersistedCanvases } from './usePersistedCanvases'
import { useCanvasSelection } from './useCanvasSelection'
import type { BoardRepository } from '../data/board-repository'

export interface CanvasState {
  canvases: LeanCanvas[]
  setCanvases: Dispatch<SetStateAction<LeanCanvas[]>>
  activeId: string | null
  setActiveId: Dispatch<SetStateAction<string | null>>
  activeCanvas: LeanCanvas | undefined
  deleted?: boolean
  loading: boolean
  error: string | null
  pending: boolean
  boards: BoardRepository
  flushCanvases: () => Promise<void>
  updateActiveCanvas: (updater: (canvas: LeanCanvas) => LeanCanvas) => void
}

export function useCanvasState(
  uid: string,
  persistence: 'firestore' | 'local' = 'firestore',
  retainDeleted = false,
  selection?: { id: string | null; setId: (id: string | null) => void },
): CanvasState {
  const { canvases, setCanvases, loading, error, pending, boards, flushCanvases } = usePersistedCanvases(
    uid,
    persistence,
  )
  const { activeId, setActiveId, activeCanvas, deleted } = useCanvasSelection(canvases, retainDeleted, selection?.id)
  const updateActiveCanvas = (updater: (canvas: LeanCanvas) => LeanCanvas) => {
    if (!activeCanvas) return
    setCanvases((current) =>
      current.map((canvas) =>
        canvas.id === activeCanvas.id ? updater(canvas) : canvas,
      ),
    )
  }
  return {
    canvases, setCanvases, activeId,
    setActiveId: selection ? (update) => selection.setId(typeof update === 'function' ? update(activeId) : update) : setActiveId,
    activeCanvas, deleted,
    loading, error, pending, boards, flushCanvases, updateActiveCanvas,
  }
}
