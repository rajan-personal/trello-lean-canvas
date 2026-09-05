import { useState, type Dispatch, type SetStateAction } from 'react'
import type { LeanCanvas } from '../data/types'

/** The retained snapshot is presentation-only: it must never enter the save target. */
export function useCanvasSelection(canvases: LeanCanvas[], retainDeleted: boolean) {
  const [selection, setSelection] = useState<{ activeId: string | null; canvas?: LeanCanvas }>({ activeId: null })
  const deleted = retainDeleted && !!selection.canvas && !canvases.some(({ id }) => id === selection.canvas?.id)
  const activeCanvas = deleted ? selection.canvas :
    canvases.find(({ id }) => id === selection.activeId) ?? canvases[0]
  if (activeCanvas !== selection.canvas) setSelection({ ...selection, canvas: activeCanvas })
  const setActiveId: Dispatch<SetStateAction<string | null>> = (update) => {
    setSelection((previous) => ({ activeId: typeof update === 'function' ? update(previous.activeId) : update }))
  }
  return { activeId: selection.activeId, setActiveId, activeCanvas, deleted }
}
