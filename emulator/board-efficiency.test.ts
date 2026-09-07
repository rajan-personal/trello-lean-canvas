import * as firestore from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { importBoard, mutateBoard, readBoard, subscribeBoard } from '../src/data/board-firestore'
import { createBoardRemoteCache } from '../src/data/board-remote-cache'
import { comment, populatedBoard } from '../unit/board-fixtures'
import { boardTestEnvironment } from './board-fixtures'

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return { ...actual, getDocsFromServer: vi.fn(actual.getDocsFromServer) }
})
let test: Awaited<ReturnType<typeof boardTestEnvironment>>
beforeAll(async () => { test = await boardTestEnvironment('lean-board-efficiency-test') })
beforeEach(async () => { vi.restoreAllMocks(); await test.seed() })
afterAll(async () => { vi.restoreAllMocks(); await test.cleanup() })

describe('Firestore efficiency and concurrency', () => {
  it('reuses a known snapshot without collection reads but rejects a stale revision', async () => {
    await importBoard(test.db, 'alice', 'a', populatedBoard(), 'import-a')
    const baseline = await readBoard(test.db, 'alice', 'a')
    const reads = vi.mocked(firestore.getDocsFromServer).mockClear()
    const saved = await mutateBoard(test.db, 'alice', 'a', { type: 'rename-column', id: 'backlog', title: 'Ideas' }, baseline)
    expect(saved?.revision).toBe(baseline.revision + 1)
    expect(saved?.data.columns[0].title).toBe('Ideas')
    await expect(mutateBoard(test.db, 'alice', 'a', { type: 'rename-column', id: 'done', title: 'Stale' }, baseline))
      .rejects.toThrow('changed in another session')
    expect(reads).not.toHaveBeenCalled()
    expect((await readBoard(test.db, 'alice', 'a')).data).toEqual(saved?.data)
  })
  it('reads only the deleted card comments, in batches of at most 200', async () => {
    const source = populatedBoard()
    source.comments = [...Array.from({ length: 205 }, (_, index) => comment(`comment-${index}`)), comment('keep', 'card-b')]
    await importBoard(test.db, 'alice', 'a', source, 'import-a')
    const reads = vi.mocked(firestore.getDocsFromServer).mockClear()
    await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: 'card-a' })
    const pages = await Promise.all(reads.mock.results.map((result) => result.value as Promise<firestore.QuerySnapshot>))
    expect(pages.map((page) => page.size)).toEqual([200, 5])
    expect(pages.flatMap((page) => page.docs).every((item) => item.data().cardId === 'card-a')).toBe(true)
    expect((await readBoard(test.db, 'alice', 'a')).data.comments).toEqual([comment('keep', 'card-b')])
  })
  it('handles real listener acknowledgments without rereading collections after an edit', async () => {
    await importBoard(test.db, 'alice', 'a', populatedBoard(), 'import-a')
    const load = vi.fn(() => readBoard(test.db, 'alice', 'a'))
    const cache = createBoardRemoteCache({ load,
      mutate: (command, source) => mutateBoard(test.db, 'alice', 'a', command, source),
      subscribe: (next, failed) => subscribeBoard(test.db, 'alice', 'a', next, failed),
    })
    const errors: unknown[] = []
    const stop = cache.subscribe(() => { void cache.load().catch((cause: unknown) => errors.push(cause)) }, (cause) => errors.push(cause))
    try {
      await vi.waitFor(() => expect(load).toHaveBeenCalled())
      await cache.load()
      const before = load.mock.calls.length
      await cache.dispatch({ type: 'rename-column', id: 'backlog', title: 'Ideas' })
      expect((await cache.load()).data.columns[0].title).toBe('Ideas')
      expect(load).toHaveBeenCalledTimes(before)
      await mutateBoard(test.db, 'alice', 'a', { type: 'rename-column', id: 'backlog', title: 'Remote' })
      await vi.waitFor(async () => expect((await cache.load()).data.columns[0].title).toBe('Remote'))
      expect(errors).toEqual([])
    } finally { stop() }
  })
})
