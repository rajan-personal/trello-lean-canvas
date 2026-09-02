import type { LeanCanvas } from './types'

const STORAGE_KEY = 'lean-canvas:v2'
const migrationKey = (uid: string) => `lean-canvas:migration:${uid}`

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

export function claimStoredCanvases(uid: string): LeanCanvas[] {
  const pending = localStorage.getItem(migrationKey(uid))
  if (pending) {
    try {
      return JSON.parse(pending) as LeanCanvas[]
    } catch {
      localStorage.removeItem(migrationKey(uid))
    }
  }
  const canvases = readStoredCanvases()
  if (!canvases.length) return []
  localStorage.setItem(migrationKey(uid), JSON.stringify(canvases))
  localStorage.removeItem(STORAGE_KEY)
  return canvases
}

export function clearClaimedCanvases(uid: string): void {
  localStorage.removeItem(migrationKey(uid))
}
