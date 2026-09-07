import { describe, expect, it, vi } from 'vitest'
import { changed, failed, repository, snapshot } from './board-remote-fixtures'
import * as remote from '../src/data/board-firestore'

const command = { type: 'rename-column' as const, id: 'backlog', title: 'Ideas' }
describe('board cache lifecycle', () => {
  it('does not resurrect a deleted board when an earlier commit resolves late', async () => {
    const repo = repository()
    const stop = repo.subscribe('a', vi.fn(), vi.fn())
    changed({ revision: 1, status: 'active' })
    await repo.load('a')
    let finish!: (value: ReturnType<typeof snapshot>) => void
    vi.mocked(remote.mutateBoard).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const saving = repo.dispatch('a', command)
    await vi.waitFor(() => expect(finish).toBeDefined())
    changed(undefined)
    finish(snapshot(2))
    await saving
    vi.mocked(remote.readBoard).mockRejectedValueOnce(new Error('Board does not exist.'))
    await expect(repo.load('a')).rejects.toThrow('does not exist')
    stop()
  })
  it('never overwrites a newer remote revision with a delayed local acknowledgment', async () => {
    const repo = repository()
    const stop = repo.subscribe('a', vi.fn(), vi.fn())
    changed({ revision: 1, status: 'active' })
    await repo.load('a')
    vi.mocked(remote.mutateBoard).mockImplementation(async () => {
      changed({ revision: 3, status: 'active' })
      return snapshot(2)
    })
    vi.mocked(remote.readBoard).mockResolvedValue(snapshot(3))
    await repo.dispatch('a', command)
    await repo.load('a')
    expect(remote.readBoard).toHaveBeenCalledTimes(2)
    stop()
  })
  it('does not reuse cache after deletion, listener failure, or switching accounts', async () => {
    const alice = repository()
    const stop = alice.subscribe('a', vi.fn(), vi.fn())
    changed({ revision: 1, status: 'active' })
    await alice.load('a')
    changed({ revision: 2, status: 'deleting' })
    vi.mocked(remote.readBoard).mockRejectedValueOnce(new Error('deleting'))
    await expect(alice.load('a')).rejects.toThrow('deleting')
    failed(new Error('permission denied'))
    await alice.load('a')
    await alice.load('a')
    expect(remote.readBoard).toHaveBeenCalledTimes(4)
    stop()
    await repository('bob').load('a')
    expect(vi.mocked(remote.readBoard).mock.lastCall?.slice(1)).toEqual(['bob', 'a'])
  })
  it('clears rejected in-flight reads so retry can succeed', async () => {
    const repo = repository()
    const stop = repo.subscribe('a', vi.fn(), vi.fn())
    vi.mocked(remote.readBoard).mockRejectedValueOnce(new Error('offline'))
    await expect(repo.load('a')).rejects.toThrow('offline')
    expect(await repo.load('a')).toEqual(snapshot().data)
    expect(remote.readBoard).toHaveBeenCalledTimes(2)
    stop()
  })
  it('does not let consumers mutate the cached write baseline', async () => {
    const repo = repository()
    const stop = repo.subscribe('a', vi.fn(), vi.fn())
    const board = await repo.load('a')
    board.cards[0].title = 'Unpersisted change'
    vi.mocked(remote.mutateBoard).mockResolvedValue(snapshot(2))
    await repo.dispatch('a', command)
    expect(vi.mocked(remote.mutateBoard).mock.lastCall?.[4]).toEqual(snapshot())
    stop()
  })
})
