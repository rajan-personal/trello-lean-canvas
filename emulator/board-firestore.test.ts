import { assertFails } from '@firebase/rules-unit-testing'
import { doc, getDocFromServer, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { boardPath, importBoard, initializeBoard, mutateBoard, readBoard } from '../src/data/board-firestore'
import { orderedCards } from '../src/data/board-mutations'
import { comment, populatedBoard } from '../unit/board-fixtures'
import { boardTestEnvironment } from './board-fixtures'

let test: Awaited<ReturnType<typeof boardTestEnvironment>>
beforeAll(async () => { test = await boardTestEnvironment('lean-board-test') })
beforeEach(async () => { await test.seed() })
afterAll(async () => { await test.cleanup() })

describe('board Firestore records', () => {
  it.each(['title', 'description'] as const)('rejects stale %s baseline at the persistence boundary', async (field) => {
    await importBoard(test.db, 'alice', 'a', populatedBoard(), 'import-a')
    const baseline = (await readBoard(test.db, 'alice', 'a')).data.cards[0]
    await mutateBoard(test.db, 'alice', 'a', { ...baseline, type: 'edit-card', expected: baseline, [field]: 'Remote edit' })
    const remote = (await readBoard(test.db, 'alice', 'a')).data
    await expect(mutateBoard(test.db, 'alice', 'a', { ...baseline, type: 'edit-card', expected: baseline,
      description: 'Local description' })).rejects.toThrow('changed elsewhere')
    expect((await readBoard(test.db, 'alice', 'a')).data).toEqual(remote)
  })
  it('initializes concurrently once and does not reset renamed columns', async () => {
    await Promise.all([initializeBoard(test.db, 'alice', 'a'), initializeBoard(test.db, 'alice', 'a')])
    await mutateBoard(test.db, 'alice', 'a', { type: 'rename-column', id: 'backlog', title: 'Ideas' })
    await initializeBoard(test.db, 'alice', 'a')
    const loaded = await readBoard(test.db, 'alice', 'a')
    expect(loaded.data.columns).toHaveLength(6)
    expect(loaded.data.columns[0].title).toBe('Ideas')
    expect(loaded.revision).toBe(2)
    await expect(initializeBoard(test.db, 'alice', 'missing')).rejects.toThrow('Save the canvas')
  })
  it('persists card editing, within/across moves and real comments independently of another canvas', async () => {
    await initializeBoard(test.db, 'alice', 'a')
    await initializeBoard(test.db, 'alice', 'b')
    for (const id of ['card-a', 'card-b']) await mutateBoard(test.db, 'alice', 'a', { type: 'create-card', id, columnId: 'backlog', title: id })
    await mutateBoard(test.db, 'alice', 'a', { type: 'move-card', id: 'card-b', columnId: 'backlog', index: 0 })
    expect(orderedCards((await readBoard(test.db, 'alice', 'a')).data, 'backlog').map(({ id }) => id)).toEqual(['card-b', 'card-a'])
    await mutateBoard(test.db, 'alice', 'a', { type: 'edit-card', id: 'card-a', expected: { title: 'card-a', description: '', columnId: 'backlog' }, title: 'Edited', description: 'Plain text', columnId: 'review' })
    await mutateBoard(test.db, 'alice', 'a', { type: 'add-comment', comment: comment() })
    const result = (await readBoard(test.db, 'alice', 'a')).data
    expect(result.comments).toEqual([comment()])
    expect(orderedCards(result, 'review')[0]).toMatchObject({ id: 'card-a', title: 'Edited', description: 'Plain text' })
    expect((await readBoard(test.db, 'alice', 'b')).data.cards).toEqual([])
    expect((await getDocFromServer(doc(test.db, 'users/alice/workspaces/default/canvases/a'))).data()).not.toHaveProperty('board')
    await expect(mutateBoard(test.db, 'alice', 'a', { type: 'delete-column', id: 'review' })).rejects.toThrow('Only empty')
    await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: 'card-a' })
    expect((await readBoard(test.db, 'alice', 'a')).data.comments).toEqual([])
  })
  it('denies anonymous/cross-user records, orphan cards and forged comment authors', async () => {
    await initializeBoard(test.db, 'alice', 'a')
    await mutateBoard(test.db, 'alice', 'a', { type: 'create-card', id: 'card-a', title: 'Card', columnId: 'backlog' })
    const path = boardPath('alice', 'a')
    for (const context of [test.environment.unauthenticatedContext(), test.environment.authenticatedContext('bob')]) {
      for (const suffix of ['', '/cards/card-a', '/comments/comment-a']) {
        await assertFails(context.firestore().doc(path + suffix).get())
        await assertFails(context.firestore().doc(path + suffix).set({ title: 'attack' }))
      }
    }
    await expect(mutateBoard(test.db, 'alice', 'a', { type: 'add-comment', comment: { ...comment(), authorId: 'bob' } })).rejects.toThrow()
    await expect(setDoc(doc(test.db, `${boardPath('alice', 'b')}/cards/orphan`), { title: 'Orphan' })).rejects.toThrow()
    await expect(updateDoc(doc(test.db, path), { columns: 'invalid', revision: 3, updatedAt: serverTimestamp() })).rejects.toThrow()
  })
})
