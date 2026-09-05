import { describe, expect, it, vi } from 'vitest'
import { startCanvasPersistence } from '../src/app/canvas-persistence-start'
import { prepareWorkspace, subscribeToWorkspace } from '../src/data/firestore'
import { createBoardRepository } from '../src/data/board-repository'
import type { WorkspaceValue } from '../src/data/firestore-model'
import type { LeanCanvas } from '../src/data/types'
import { MemoryStorage, populatedBoard } from './board-fixtures'
import { canvas } from './fixtures'
vi.mock('../src/data/firestore', () => ({ prepareWorkspace: vi.fn(), subscribeToWorkspace: vi.fn() }))

describe('canvas persistence startup recovery', () => {
  it('supplies local boards before publication and keeps the claim when board copying fails', async () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('localStorage', storage)
    storage.setItem('lean-canvas:v2', JSON.stringify([canvas('local')]))
    storage.setItem('lean-canvas:boards:v1', JSON.stringify({ local: populatedBoard() }))
    const boards = createBoardRepository('alice', 'local', storage)
    vi.mocked(prepareWorkspace).mockResolvedValue({ consumedLocal: true })
    vi.spyOn(boards, 'sync').mockRejectedValue(new Error('Interrupted board copy'))
    const error = vi.fn()
    const cleanup = startCanvasPersistence({ uid: 'alice', isLocal: false, boards,
      current: { current: [] }, ready: { current: false }, base: { current: null },
      setCanvases: vi.fn(), setLoading: vi.fn(), setError: error })
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('Interrupted board copy'))
    expect(prepareWorkspace).toHaveBeenCalledWith('alice', [canvas('local')], { local: populatedBoard() })
    expect(boards.pendingImports()).toHaveLength(1)
    expect(storage.getItem('lean-canvas:migration:alice')).not.toBeNull()
    expect(storage.getItem('lean-canvas:v2')).not.toBeNull()
    cleanup()
    vi.unstubAllGlobals()
  })
  it('restores staged canvases and removes tombstoned canvases from the next save target', async () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('localStorage', storage)
    const boards = createBoardRepository('alice', 'local', storage)
    boards.stageImport(canvas('pending'), populatedBoard())
    vi.spyOn(boards, 'deletingCanvasIds').mockResolvedValue(['deleting'])
    vi.mocked(prepareWorkspace).mockResolvedValue({ consumedLocal: false })
    const remote: WorkspaceValue = { canvases: [canvas('deleting'), canvas('kept')], revisions: { deleting: 1, kept: 1 }, orderRevision: 1 }
    const stop = vi.fn()
    vi.mocked(subscribeToWorkspace).mockImplementation((_uid, value) => { value(remote); return stop })
    const current = { current: [] as LeanCanvas[] }
    const ready = { current: false }
    const base = { current: null as WorkspaceValue | null }
    const error = vi.fn()
    const cleanup = startCanvasPersistence({ uid: 'alice', isLocal: false, boards, current, ready, base,
      setCanvases: (update) => { current.current = typeof update === 'function' ? update(current.current) : update },
      setLoading: vi.fn(), setError: error })
    await vi.waitFor(() => expect(ready.current).toBe(true))
    expect(current.current.map(({ id }) => id)).toEqual(['kept', 'pending'])
    expect(base.current).toBe(remote)
    expect(boards.pendingImports()).toHaveLength(1)
    cleanup()
    expect(stop).toHaveBeenCalledOnce()
    expect(ready.current).toBe(false)
    vi.unstubAllGlobals()
  })
  it('does not discard a pending import when workspace preparation fails', async () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('localStorage', storage)
    const boards = createBoardRepository('alice', 'local', storage)
    boards.stageImport(canvas('pending'), populatedBoard())
    vi.mocked(prepareWorkspace).mockRejectedValue(new Error('Offline'))
    const error = vi.fn()
    const cleanup = startCanvasPersistence({ uid: 'alice', isLocal: false, boards,
      current: { current: [] }, ready: { current: false }, base: { current: null },
      setCanvases: vi.fn(), setLoading: vi.fn(), setError: error })
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('Offline'))
    expect(boards.pendingImports()).toHaveLength(1)
    cleanup()
    vi.unstubAllGlobals()
  })
})
