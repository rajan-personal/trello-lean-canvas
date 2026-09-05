import { describe, expect, it } from 'vitest'
import { createBoardRepository } from '../src/data/board-repository'
import { readLocalBoards } from '../src/data/board-storage'
import { orderedCards } from '../src/data/board-mutations'
import { createBoard } from '../src/data/board'
import { MemoryStorage, populatedBoard, comment } from './board-fixtures'
import { canvas } from './fixtures'

describe('local board repository', () => {
  it.each(['title', 'description'] as const)('rejects a stale editor when %s changed without notification', async (field) => {
    const storage = new MemoryStorage()
    const repo = createBoardRepository('alice', 'local', storage)
    repo.stageImport(canvas('a'), populatedBoard())
    await repo.sync([canvas('a')])
    const baseline = (await repo.load('a')).cards[0]
    const persisted = readLocalBoards(storage)
    persisted.a.cards[0][field] = 'Remote edit'
    storage.setItem('lean-canvas:boards:v1', JSON.stringify(persisted))
    await expect(repo.dispatch('a', { type: 'edit-card', id: baseline.id, expected: baseline,
      title: baseline.title, description: 'Local description', columnId: baseline.columnId })).rejects.toThrow('changed elsewhere')
    expect(await repo.load('a')).toEqual(persisted.a)
  })
  it('initializes once, persists moves/comments on reload and isolates canvases', async () => {
    const storage = new MemoryStorage()
    const repo = createBoardRepository('alice', 'local', storage)
    await repo.sync([canvas('a'), canvas('b')])
    await repo.dispatch('a', { type: 'create-card', id: 'card-a', columnId: 'backlog', title: 'Card' })
    await repo.dispatch('a', { type: 'add-comment', comment: comment() })
    await repo.dispatch('a', { type: 'move-card', id: 'card-a', columnId: 'done', index: 0 })
    const reloaded = createBoardRepository('alice', 'local', storage)
    await reloaded.sync([canvas('a'), canvas('b')])
    expect(orderedCards(await reloaded.load('a'), 'done')[0].id).toBe('card-a')
    expect((await reloaded.load('a')).comments).toEqual([comment()])
    expect(await reloaded.load('b')).toEqual(createBoard())
    await expect(reloaded.dispatch('a', { type: 'add-comment', comment: { ...comment('other'), authorId: 'bob' } })).rejects.toThrow('current author')
  })
  it('retains import source after failure, resumes on reload without duplicate cards/comments', async () => {
    const storage = new MemoryStorage()
    const repo = createBoardRepository('alice', 'local', storage)
    repo.stageImport(canvas('a'), populatedBoard())
    storage.failKey = 'lean-canvas:boards:v1'
    await expect(repo.sync([canvas('a')])).rejects.toThrow('quota')
    expect(repo.pendingImports()).toHaveLength(1)
    storage.failKey = null
    const reloaded = createBoardRepository('alice', 'local', storage)
    await reloaded.sync(reloaded.pendingImports().map(({ canvas }) => canvas))
    await reloaded.sync([canvas('a')])
    expect(await reloaded.load('a')).toEqual(populatedBoard())
    expect(reloaded.pendingImports()).toEqual([])
  })
  it('reports corrupt local board storage instead of overwriting it', async () => {
    const storage = new MemoryStorage()
    storage.setItem('lean-canvas:boards:v1', '{broken')
    await expect(createBoardRepository('a', 'local', storage).initialize('a')).rejects.toThrow()
    expect(storage.getItem('lean-canvas:boards:v1')).toBe('{broken')
  })
  it('cleans removed canvas records and retries orphan cleanup on reload', async () => {
    const storage = new MemoryStorage()
    const repo = createBoardRepository('alice', 'local', storage)
    repo.stageImport(canvas('a'), populatedBoard())
    await repo.sync([canvas('a'), canvas('b')])
    await createBoardRepository('alice', 'local', storage).sync([canvas('b')])
    expect(Object.keys(readLocalBoards(storage))).toEqual(['b'])
  })
  it('separates account-scoped pending sources', () => {
    const storage = new MemoryStorage()
    createBoardRepository('alice', 'firestore', storage).stageImport(canvas(), populatedBoard())
    expect(createBoardRepository('bob', 'firestore', storage).pendingImports()).toEqual([])
    expect(createBoardRepository('alice', 'firestore', storage).pendingImports()).toHaveLength(1)
  })
})
