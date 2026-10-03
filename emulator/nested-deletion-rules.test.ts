import { assertFails } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDocFromServer, runTransaction, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { boardPath, importBoard, initializeBoard, mutateBoard, prepareBoardDeletion, readBoard } from '../src/data/board-firestore'
import { applyBoardCommand } from '../src/data/board-mutations'
import { finishCardDeletion, startCardDeletion } from '../src/data/board-firestore-delete'
import { boardTestEnvironment } from './board-fixtures'

let test: Awaited<ReturnType<typeof boardTestEnvironment>>
beforeAll(async () => { test = await boardTestEnvironment('lean-nested-deletion-test') })
beforeEach(async () => { await test.seed(); await initializeBoard(test.db, 'alice', 'a') })
afterAll(async () => { await test.cleanup() })
const path = boardPath('alice', 'a')
const add = (id: string, parentTicketId?: string) => mutateBoard(test.db, 'alice', 'a',
  { type: 'create-card', id, title: id, columnId: 'todo', parentTicketId })
const count = async (id: string) => (await getDocFromServer(doc(test.db, `${path}/childCounts`, id))).data()?.count

// The pre-nesting client checks no child query and uses the latest board revision.
async function legacyStartDeletion(id: string) {
  await runTransaction(test.db, async (tx) => {
    const ref = doc(test.db, path)
    const board = (await tx.get(ref)).data()!
    await tx.get(doc(test.db, `${path}/cards`, id))
    tx.update(ref, { status: 'deleting-card', deletingCardId: id,
      revision: board.revision + 1, updatedAt: serverTimestamp() })
  })
}

it('rejects an old tab deleting a parent before any comments are drained', async () => {
  await add('parent'); await add('child', 'parent')
  await mutateBoard(test.db, 'alice', 'a', { type: 'add-comment', comment: {
    id: 'keep', cardId: 'parent', text: 'Keep this comment', authorId: 'alice', authorName: 'Alice',
    createdAt: new Date().toISOString(),
  } })
  await assertFails(legacyStartDeletion('parent'))
  expect((await getDocFromServer(doc(test.db, path))).data()?.status).toBe('active')
  expect((await readBoard(test.db, 'alice', 'a')).data.cards).toHaveLength(2)
  expect((await readBoard(test.db, 'alice', 'a')).data.comments).toHaveLength(1)
  expect(await count('parent')).toBe(1)
  await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: 'child' })
  expect(await count('parent')).toBe(0)
  await legacyStartDeletion('parent')
  await finishCardDeletion(test.db, 'alice', 'a', 'parent')
  expect((await readBoard(test.db, 'alice', 'a')).data.cards).toHaveLength(0)
})

it('rejects missing or forged counters, including clearing the guard before deletion', async () => {
  await add('parent')
  const board = (await getDocFromServer(doc(test.db, path))).data()!
  const batch = writeBatch(test.db)
  batch.update(doc(test.db, path), { revision: board.revision + 1, updatedAt: serverTimestamp() })
  batch.set(doc(test.db, `${path}/cards`, 'unguarded'), { schemaVersion: 1, canvasId: 'a', parentTicketId: 'parent',
    title: 'unguarded', columnId: 'todo', description: '', rank: 'h', updatedAt: serverTimestamp() })
  await assertFails(batch.commit())
  await add('child', 'parent')
  const guard = doc(test.db, `${path}/childCounts`, 'parent')
  await assertFails(setDoc(guard, { count: 0, childId: 'child' }))
  await assertFails(deleteDoc(guard))
  await startCardDeletion(test.db, 'alice', 'a', 'child')
  await assertFails(deleteDoc(doc(test.db, `${path}/cards`, 'child')))
  await finishCardDeletion(test.db, 'alice', 'a', 'child')
  expect(await count('parent')).toBe(0)
})

it('serializes child creation against parent deletion without orphaning the board', async () => {
  await add('parent')
  const results = await Promise.allSettled([add('child', 'parent'), legacyStartDeletion('parent')])
  expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
  // Reading recovers the tombstone if deletion won the race.
  const board = (await readBoard(test.db, 'alice', 'a')).data
  expect(board.cards.map(({ id }) => id).sort()).toEqual(results[0].status === 'fulfilled' ? ['child', 'parent'] : [])
})

it('cleans up hierarchy guards during whole-project deletion', async () => {
  await add('parent'); await add('child', 'parent'); await add('grandchild', 'child')
  await prepareBoardDeletion(test.db, 'alice', 'a')
  expect(await count('parent')).toBeUndefined()
  expect(await count('child')).toBeUndefined()
})

it('resumes an interrupted nested import without double-counting existing children', async () => {
  await add('parent'); await add('child', 'parent')
  let source = (await readBoard(test.db, 'alice', 'a')).data
  for (let i = 0; i < 12; i++) source = applyBoardCommand(source,
    { type: 'create-card', id: `sibling-${i}`, title: 'Sibling', columnId: 'todo', parentTicketId: 'parent' })
  source.cards.reverse()
  // This is the durable state after an importer committed its first child and stopped.
  await test.environment.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(path).update({ status: 'importing', importId: 'resume' })
  })
  await importBoard(test.db, 'alice', 'a', source, 'resume')
  await importBoard(test.db, 'alice', 'a', source, 'resume')
  expect(await count('parent')).toBe(13)
  expect((await readBoard(test.db, 'alice', 'a')).data.cards).toHaveLength(14)
  await assertFails(legacyStartDeletion('parent'))
  for (const card of source.cards.filter(({ parentTicketId }) => parentTicketId))
    await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: card.id })
  expect(await count('parent')).toBe(0)
  await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: 'parent' })
})
