import { describe, expect, it, vi } from 'vitest'
import { changed, failed, repository, snapshot } from './board-remote-fixtures'
import * as remote from '../src/data/board-firestore'
import { canvas } from './fixtures'

describe('Firestore board read budget', () => {
  it('does not eagerly initialize unopened boards during workspace sync', async () => {
    const repo = repository()
    await repo.sync([canvas('a'), canvas('b')])
    expect(remote.initializeBoard).not.toHaveBeenCalled()
    await repo.load('a')
    expect(remote.initializeBoard).toHaveBeenCalledTimes(1)
    expect(remote.initializeBoard).toHaveBeenCalledWith(expect.anything(), 'alice', 'a')
  })
  it('initializes only newly saved boards, including one opened before its canvas was saved', async () => {
    const repo = repository()
    vi.mocked(remote.initializeBoard).mockRejectedValueOnce(new Error('Save the canvas'))
    await expect(repo.load('new')).rejects.toThrow('Save the canvas')
    vi.clearAllMocks()
    await repo.sync([canvas('old'), canvas('new')], ['new'])
    expect(remote.initializeBoard).toHaveBeenCalledTimes(1)
    expect(vi.mocked(remote.initializeBoard).mock.calls[0].slice(1)).toEqual(['alice', 'new'])
  })
  it('coalesces overlapping loads and reuses a snapshot only while subscribed', async () => {
    const repo = repository()
    const stop = repo.subscribe('a', vi.fn(), vi.fn())
    changed({ revision: 1, status: 'active' })
    await Promise.all([repo.load('a'), repo.load('a'), repo.load('a')])
    await repo.load('a')
    expect(remote.readBoard).toHaveBeenCalledTimes(1)
    stop()
    await repo.load('a')
    expect(remote.readBoard).toHaveBeenCalledTimes(2)
  })
  it('uses the displayed revision for a write and avoids acknowledgment/explicit reload reads', async () => {
    const repo = repository()
    const listener = vi.fn()
    const stop = repo.subscribe('a', listener, vi.fn())
    changed({ revision: 1, status: 'active' })
    await repo.load('a')
    const command = { type: 'rename-column' as const, id: 'backlog', title: 'Ideas' }
    let acknowledgmentLoad: Promise<unknown> | undefined
    listener.mockImplementation(() => { acknowledgmentLoad = repo.load('a') })
    vi.mocked(remote.mutateBoard).mockImplementation(async () => {
      changed({ revision: 2, status: 'active' })
      return snapshot(2)
    })
    await repo.dispatch('a', command)
    await acknowledgmentLoad
    expect(remote.mutateBoard).toHaveBeenCalledWith(expect.anything(), 'alice', 'a', command, snapshot())
    expect(await repo.load('a')).toEqual(snapshot(2).data)
    expect(remote.readBoard).toHaveBeenCalledTimes(1)
    stop()
  })
  it('invalidates on remote changes, failed writes and listener errors', async () => {
    const repo = repository()
    const stop = repo.subscribe('a', vi.fn(), vi.fn())
    changed({ revision: 1, status: 'active' })
    await repo.load('a')
    changed({ revision: 2, status: 'active' })
    vi.mocked(remote.readBoard).mockResolvedValue(snapshot(2))
    await repo.load('a')
    expect(remote.readBoard).toHaveBeenCalledTimes(2)
    vi.mocked(remote.mutateBoard).mockRejectedValue(new Error('conflict'))
    await expect(repo.dispatch('a', { type: 'rename-column', id: 'backlog', title: 'Ideas' })).rejects.toThrow('conflict')
    await repo.load('a')
    expect(remote.readBoard).toHaveBeenCalledTimes(3)
    failed(new Error('offline'))
    await repo.load('a')
    expect(remote.readBoard).toHaveBeenCalledTimes(4)
    stop()
  })
  it('does not lose a remote invalidation arriving during an in-flight read', async () => {
    const repo = repository()
    const stop = repo.subscribe('a', vi.fn(), vi.fn())
    changed({ revision: 1, status: 'active' })
    let finish!: (value: ReturnType<typeof snapshot>) => void
    vi.mocked(remote.readBoard).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const loading = repo.load('a')
    await vi.waitFor(() => expect(finish).toBeDefined())
    changed({ revision: 2, status: 'active' })
    vi.mocked(remote.readBoard).mockResolvedValue(snapshot(2))
    finish(snapshot())
    await loading
    await repo.load('a')
    expect(remote.readBoard).toHaveBeenCalledTimes(2)
    stop()
  })
})
