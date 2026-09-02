import type { LeanCanvas } from './types'

const STORAGE_KEY = 'lean-canvas:v2'

export function readStoredCanvases(): LeanCanvas[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null) return []
  try {
    const stored: unknown = JSON.parse(saved)
    if (!Array.isArray(stored)) return []
    return (stored as LeanCanvas[]).map((canvas) => ({
      ...canvas,
      notes: typeof canvas.notes === 'string' ? canvas.notes : '',
    }))
  } catch {
    return []
  }
}

export function writeStoredCanvases(canvases: LeanCanvas[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
}
