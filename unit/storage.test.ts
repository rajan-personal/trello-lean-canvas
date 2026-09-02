import { describe, expect, it } from 'vitest'
import {
  claimStoredCanvases, clearClaimedCanvases, readStoredCanvases, writeStoredCanvases,
} from '../src/data/storage'
import { canvas } from './fixtures'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}
describe('local migration claims', () => {
  it('keeps both legacy source and UID claim until durable success', () => {
    const storage = new MemoryStorage()
    writeStoredCanvases([canvas()], storage)
    expect(claimStoredCanvases('alice', storage)).toHaveLength(1)
    expect(storage.getItem('lean-canvas:v2')).not.toBeNull()
    expect(storage.getItem('lean-canvas:migration:alice')).not.toBeNull()
    expect(claimStoredCanvases('alice', storage)).toHaveLength(1)
    clearClaimedCanvases('alice', storage)
    expect(storage.getItem('lean-canvas:v2')).toBeNull()
    expect(storage.getItem('lean-canvas:migration:alice')).toBeNull()
  })
  it('does not delete a legacy source changed after it was claimed', () => {
    const storage = new MemoryStorage()
    writeStoredCanvases([canvas()], storage)
    claimStoredCanvases('alice', storage)
    writeStoredCanvases([canvas('new')], storage)
    clearClaimedCanvases('alice', storage)
    expect(readStoredCanvases(storage)[0].id).toBe('new')
  })
  it('rejects malformed persisted arrays', () => {
    const storage = new MemoryStorage()
    storage.setItem('lean-canvas:v2', JSON.stringify([{ id: 'partial' }]))
    expect(readStoredCanvases(storage)).toEqual([])
  })
})
