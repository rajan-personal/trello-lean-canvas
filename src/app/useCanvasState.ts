import { useState, type Dispatch, type SetStateAction } from 'react'
import type { LeanCanvas } from '../data/types'
import { usePersistedCanvases } from './usePersistedCanvases'

export interface CanvasState {
  canvases: LeanCanvas[]
  setCanvases: Dispatch<SetStateAction<LeanCanvas[]>>
  activeId: string | null
  setActiveId: Dispatch<SetStateAction<string | null>>
  activeCanvas: LeanCanvas | undefined
  loading: boolean
  error: string | null
  updateActiveCanvas: (updater: (canvas: LeanCanvas) => LeanCanvas) => void
}

export function useCanvasState(
  uid: string,
  persistence: 'firestore' | 'local' = 'firestore',
): CanvasState {
  const { canvases, setCanvases, loading, error } = usePersistedCanvases(
    uid,
    persistence,
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeCanvas =
    canvases.find((canvas) => canvas.id === activeId) ?? canvases[0]
  const updateActiveCanvas = (updater: (canvas: LeanCanvas) => LeanCanvas) => {
    if (!activeCanvas) return
    setCanvases((current) =>
      current.map((canvas) =>
        canvas.id === activeCanvas.id ? updater(canvas) : canvas,
      ),
    )
  }
  return {
    canvases, setCanvases, activeId, setActiveId, activeCanvas,
    loading, error, updateActiveCanvas,
  }
}
