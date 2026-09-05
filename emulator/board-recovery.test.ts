import * as firestore from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { boardPath, deletingBoardIds, importBoard, initializeBoard, mutateBoard, readBoard } from '../src/data/board-firestore'
import { saveCanvasDiff } from '../src/data/firestore-writes'
import { comment, populatedBoard } from '../unit/board-fixtures'
import { canvas } from '../unit/fixtures'
import { boardTestEnvironment } from './board-fixtures'

let test: Awaited<ReturnType<typeof boardTestEnvironment>>
beforeAll(async () => { test = await boardTestEnvironment('lean-board-recovery-test') })
beforeEach(async () => { vi.restoreAllMocks(); await test.seed() })
afterAll(async () => { vi.restoreAllMocks(); await test.cleanup() })
function failBatch(number: number) {
  const original = firestore.WriteBatch.prototype.commit
  let calls = 0
  return vi.spyOn(firestore.WriteBatch.prototype, 'commit').mockImplementation(function (this: firestore.WriteBatch) {
    if (++calls === number) return Promise.reject(new Error('Injected batch failure'))
    return original.call(this)
  })
}
describe('board recovery', () => {
  it('retains partial import records, retries idempotently and never overwrites subsequent edits', async () => {
    const source = populatedBoard()
    for (let index = 0; index < 20; index++) {
      source.cards.push({ id: `extra-${index}`, title: 'Extra', description: '', columnId: 'done', rank: `h${index.toString(36)}h` })
      source.comments.push({ ...comment(`extra-comment-${index}`, `extra-${index}`), authorId: 'historical-author' })
    }
    const spy = failBatch(2)
    await expect(importBoard(test.db, 'alice', 'a', source, 'import-a')).rejects.toThrow('Injected')
    spy.mockRestore()
    expect((await firestore.getDocsFromServer(firestore.collection(test.db, `${boardPath('alice', 'a')}/cards`))).size).toBe(10)
    await expect(readBoard(test.db, 'alice', 'a')).rejects.toThrow('importing')
    await expect(mutateBoard(test.db, 'alice', 'a', { type: 'create-card', id: 'blocked', columnId: 'done', title: 'Blocked' })).rejects.toThrow('importing')
    await importBoard(test.db, 'alice', 'a', source, 'import-a')
    const loaded = (await readBoard(test.db, 'alice', 'a')).data
    expect(loaded.cards).toHaveLength(source.cards.length)
    expect(loaded.comments).toHaveLength(source.comments.length)
    expect(loaded.comments).toEqual(expect.arrayContaining(source.comments))
    await mutateBoard(test.db, 'alice', 'a', { type: 'edit-card', id: 'card-a', expected: populatedBoard().cards[0], title: 'Later edit', description: '', columnId: 'done' })
    await importBoard(test.db, 'alice', 'a', source, 'import-a')
    expect((await readBoard(test.db, 'alice', 'a')).data.cards.find(({ id }) => id === 'card-a')?.title).toBe('Later edit')
  })
  it('blocks writes after cleanup failure and resumes deletion with no orphan records', async () => {
    const base = await test.seed()
    const source = populatedBoard()
    source.comments = Array.from({ length: 205 }, (_, index) => comment(`comment-${index}`))
    await importBoard(test.db, 'alice', 'a', source, 'import-a')
    await initializeBoard(test.db, 'alice', 'b')
    const spy = failBatch(2)
    await expect(saveCanvasDiff(test.db, 'alice', base, [canvas('b')])).rejects.toThrow('Injected')
    spy.mockRestore()
    expect(await deletingBoardIds(test.db, 'alice', ['a', 'b'])).toEqual(['a'])
    await initializeBoard(test.db, 'alice', 'a')
    await expect(mutateBoard(test.db, 'alice', 'a', { type: 'rename-column', id: 'backlog', title: 'Blocked' })).rejects.toThrow('deleting')
    const ref = firestore.doc(test.db, boardPath('alice', 'a'))
    const record = (await firestore.getDocFromServer(ref)).data()!
    const remaining = await firestore.getDocsFromServer(firestore.collection(test.db, `${ref.path}/comments`))
    expect(remaining.size).toBe(5)
    await expect(firestore.updateDoc(ref, { status: 'active', revision: record.revision + 1, updatedAt: firestore.serverTimestamp() })).rejects.toThrow()
    await expect(firestore.updateDoc(ref, { columns: [], revision: record.revision + 1, updatedAt: firestore.serverTimestamp() })).rejects.toThrow()
    await expect(firestore.updateDoc(firestore.doc(test.db, `${ref.path}/cards/card-a`), { title: 'Blocked', updatedAt: firestore.serverTimestamp() })).rejects.toThrow()
    await expect(firestore.updateDoc(remaining.docs[0].ref, { text: 'Blocked', updatedAt: firestore.serverTimestamp() })).rejects.toThrow()
    await saveCanvasDiff(test.db, 'alice', base, [canvas('b')])
    expect((await firestore.getDocFromServer(ref)).exists()).toBe(false)
    for (const kind of ['cards', 'comments'])
      expect((await firestore.getDocsFromServer(firestore.collection(test.db, `${ref.path}/${kind}`))).empty).toBe(true)
    expect((await firestore.getDocFromServer(firestore.doc(test.db, 'users/alice/workspaces/default/canvases/a'))).exists()).toBe(false)
    expect((await readBoard(test.db, 'alice', 'b')).data.cards).toEqual([])
  })
  it('resumes interrupted card/comment deletion on the next read', async () => {
    await importBoard(test.db, 'alice', 'a', populatedBoard(), 'import-a')
    const spy = failBatch(1)
    await expect(mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: 'card-a' })).rejects.toThrow('Injected')
    spy.mockRestore()
    const loaded = (await readBoard(test.db, 'alice', 'a')).data
    expect(loaded.cards.map(({ id }) => id)).toEqual(['card-b'])
    expect(loaded.comments).toEqual([])
  })
})
