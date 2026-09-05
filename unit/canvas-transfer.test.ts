import type { ChangeEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { canvasTransfer } from '../src/app/canvas-transfer'
import type { CanvasState } from '../src/app/useCanvasState'
import { createBoardRepository } from '../src/data/board-repository'
import { downloadYaml } from '../src/data/download'
import { canvasToYaml } from '../src/data/yaml'
import { canvas } from './fixtures'
import { MemoryStorage, populatedBoard } from './board-fixtures'
vi.mock('../src/data/download', () => ({ downloadYaml: vi.fn() }))

function stateFixture() {
  const state: CanvasState = {
    canvases: [], activeId: null, activeCanvas: undefined, loading: false, error: null, pending: false,
    boards: createBoardRepository('alice', 'local', new MemoryStorage()),
    setCanvases: (update) => { state.canvases = typeof update === 'function' ? update(state.canvases) : update },
    setActiveId: (update) => { state.activeId = typeof update === 'function' ? update(state.activeId) : update },
    updateActiveCanvas: vi.fn(), flushCanvases: async () => { await state.boards.sync(state.canvases) },
  }
  return state
}
describe('canvas transfer lifecycle', () => {
  it('stages source before flush, reports failure, and retries the same canvas/cards/comments', async () => {
    const state = stateFixture()
    const notify = vi.fn()
    const sync = state.flushCanvases
    state.flushCanvases = vi.fn(async () => {
      expect(state.canvases).toHaveLength(1)
      expect(state.boards.pendingImports()).toHaveLength(1)
      throw new Error('Canvas save failed')
    })
    const input = { files: [new File([canvasToYaml(canvas(), populatedBoard())], 'board.yaml')], value: 'board.yaml' }
    await canvasTransfer(state, vi.fn(), notify).importYaml({ target: input } as unknown as ChangeEvent<HTMLInputElement>)
    expect(notify).toHaveBeenLastCalledWith('Import retained for retry on reload. Canvas save failed')
    expect(input.value).toBe('')
    const id = state.canvases[0].id
    expect(state.boards.pendingImports()[0].canvas.id).toBe(id)
    await expect(state.boards.load(id)).rejects.toThrow('not been initialized')
    await sync()
    await sync()
    expect(state.canvases).toHaveLength(1)
    expect(await state.boards.load(id)).toEqual(populatedBoard())
  })
  it('waits for a successful flush and board read before downloading, never silently omits a failed board', async () => {
    vi.mocked(downloadYaml).mockClear()
    const state = stateFixture()
    state.canvases = [canvas()]
    state.activeCanvas = state.canvases[0]
    const notify = vi.fn()
    let finish: () => void = () => undefined
    const wait = new Promise<void>((resolve) => { finish = resolve })
    const sync = state.flushCanvases
    state.flushCanvases = async () => { await wait; await sync() }
    const commands = canvasTransfer(state, vi.fn(), notify)
    const exporting = commands.exportYaml()
    expect(downloadYaml).not.toHaveBeenCalled()
    finish()
    await exporting
    expect(downloadYaml).toHaveBeenCalledOnce()
    vi.mocked(downloadYaml).mockClear()
    vi.spyOn(state.boards, 'load').mockRejectedValue(new Error('Board read failed'))
    await commands.exportYaml()
    expect(downloadYaml).not.toHaveBeenCalled()
    expect(notify).toHaveBeenLastCalledWith('Board read failed')
  })
})
