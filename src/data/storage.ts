import type { LeanCanvas } from './types'

const STORAGE_KEY = 'lean-canvas:v2'

export function readStoredCanvases(): LeanCanvas[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null) return []
  try {
    const stored: unknown = JSON.parse(saved)
    return Array.isArray(stored) ? (stored as LeanCanvas[]) : []
  } catch {
    return []
  }
}

export function writeStoredCanvases(canvases: LeanCanvas[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
}
