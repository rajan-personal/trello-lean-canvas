import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { LeanCanvas } from '../data/types'
import {
  readStoredCanvases,
  writeStoredCanvases,
} from '../data/storage'

export interface CanvasState {
  canvases: LeanCanvas[]
  setCanvases: Dispatch<SetStateAction<LeanCanvas[]>>
  activeId: string | null
  setActiveId: Dispatch<SetStateAction<string | null>>
  activeCanvas: LeanCanvas | undefined
  updateActiveCanvas: (updater: (canvas: LeanCanvas) => LeanCanvas) => void
}

export function useCanvasState(): CanvasState {
  const [canvases, setCanvases] = useState<LeanCanvas[]>(readStoredCanvases)
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeCanvas =
    canvases.find((canvas) => canvas.id === activeId) ?? canvases[0]
  useEffect(() => writeStoredCanvases(canvases), [canvases])
  const updateActiveCanvas = (updater: (canvas: LeanCanvas) => LeanCanvas) => {
    if (!activeCanvas) return
    setCanvases((current) =>
      current.map((canvas) =>
        canvas.id === activeCanvas.id ? updater(canvas) : canvas,
      ),
    )
  }
  return {
    canvases,
    setCanvases,
    activeId,
    setActiveId,
    activeCanvas,
    updateActiveCanvas,
  }
}
