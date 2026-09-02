import { parseCanvasArray } from './canvas-schema'
import type { LeanCanvas } from './types'

const STORAGE_KEY = 'lean-canvas:v2'
const migrationKey = (uid: string) => `lean-canvas:migration:${uid}`
const browserStorage = () => globalThis.localStorage
function parseStored(value: string | null): LeanCanvas[] {
  if (value === null) return []
  try {
    const parsed = parseCanvasArray(JSON.parse(value))
    return parsed.ok ? parsed.value : []
  } catch { return [] }
}
export function readStoredCanvases(storage: Storage = browserStorage()): LeanCanvas[] {
  return parseStored(storage.getItem(STORAGE_KEY))
}
function serializeCanvases(canvases: LeanCanvas[]): string {
  const parsed = parseCanvasArray(canvases)
  if (!parsed.ok) throw new Error(`Invalid stored canvases: ${parsed.error}`)
  return JSON.stringify(parsed.value)
}
export function writeStoredCanvases(
  canvases: LeanCanvas[], storage: Storage = browserStorage(),
): void { storage.setItem(STORAGE_KEY, serializeCanvases(canvases)) }
export function claimStoredCanvases(
  uid: string, storage: Storage = browserStorage(),
): LeanCanvas[] {
  const pending = storage.getItem(migrationKey(uid))
  if (pending !== null) return parseStored(pending)
  const source = storage.getItem(STORAGE_KEY)
  const canvases = parseStored(source)
  if (!canvases.length) return []
  storage.setItem(migrationKey(uid), source as string)
  return canvases
}
export function clearClaimedCanvases(
  uid: string, storage: Storage = browserStorage(),
): void {
  const claim = storage.getItem(migrationKey(uid))
  if (claim !== null && storage.getItem(STORAGE_KEY) === claim)
    storage.removeItem(STORAGE_KEY)
  storage.removeItem(migrationKey(uid))
}
