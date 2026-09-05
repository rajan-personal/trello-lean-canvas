import { useEffect, useState, type ReactNode } from 'react'
import type { LeanCanvas } from '../data/types'
import type { BoardData } from '../data/board'

const emptyBoards = {}
export function WorkspaceSeed({ canvases, boards = emptyBoards, children }: {
  canvases: LeanCanvas[]; boards?: Record<string, BoardData>; children: ReactNode
}) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (!active) return
      localStorage.setItem('lean-canvas:v2', JSON.stringify(canvases))
      localStorage.setItem('lean-canvas:boards:v1', JSON.stringify(boards))
      setReady(true)
    })
    return () => { active = false }
  }, [canvases, boards])
  return ready ? children : null
}
