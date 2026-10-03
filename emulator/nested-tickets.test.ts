import { assertFails } from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { boardPath, importBoard, initializeBoard, mutateBoard, readBoard, readBoardSummary } from '../src/data/board-firestore'
import { createBoard } from '../src/data/board'
import { applyBoardCommand } from '../src/data/board-mutations'
import { startCardDeletion } from '../src/data/board-firestore-delete'
import { boardTestEnvironment } from './board-fixtures'

let test: Awaited<ReturnType<typeof boardTestEnvironment>>
beforeAll(async () => { test = await boardTestEnvironment('lean-nested-test') })
beforeEach(async () => { await test.seed() })
afterAll(async () => { await test.cleanup() })
const add = async (id: string, parentTicketId?: string) => mutateBoard(test.db, 'alice', 'a',
  { type: 'create-card', id, title: id, columnId: 'todo', parentTicketId })

it('persists nested tickets and summaries; prevents non-leaf deletion and allows leaf deletion', async () => {
  await initializeBoard(test.db, 'alice', 'a')
  await add('root'); await add('child', 'root'); await add('grandchild', 'child')
  expect((await readBoardSummary(test.db, 'alice', 'a')).data.cards.find(({ id }) => id === 'grandchild'))
    .toMatchObject({ parentTicketId: 'child' })
  await expect(startCardDeletion(test.db, 'alice', 'a', 'root')).rejects.toThrow('child tickets')
  await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: 'grandchild' })
  await mutateBoard(test.db, 'alice', 'a', { type: 'delete-card', id: 'child' })
  expect((await readBoard(test.db, 'alice', 'a')).data.cards.map(({ id }) => id)).toEqual(['root'])
})

it('rules reject missing parents, self-parenting and changing a parent link', async () => {
  await initializeBoard(test.db, 'alice', 'a'); await add('root'); await add('child', 'root')
  const path = boardPath('alice', 'a')
  for (const [id, parentTicketId] of [['new', 'missing'], ['self', 'self'], ['root', 'child']]) {
    const snapshot = await readBoard(test.db, 'alice', 'a')
    const batch = writeBatch(test.db)
    batch.update(doc(test.db, path), { revision: snapshot.revision + 1, updatedAt: serverTimestamp() })
    if (id === 'root') batch.update(doc(test.db, `${path}/cards`, id), { parentTicketId, updatedAt: serverTimestamp() })
    else batch.set(doc(test.db, `${path}/cards`, id), { schemaVersion: 1, canvasId: 'a', parentTicketId,
      title: id, columnId: 'todo', description: '', rank: 'z', updatedAt: serverTimestamp() })
    await assertFails(batch.commit())
  }
})

it('imports descendants before parents in the input, across batch boundaries, and resumes safely', async () => {
  let board = createBoard()
  for (let index = 0; index < 12; index++) board = applyBoardCommand(board, { type: 'create-card',
    id: `t${index}`, title: `t${index}`, columnId: 'todo', parentTicketId: index ? `t${index - 1}` : null })
  board.cards.reverse()
  await importBoard(test.db, 'alice', 'a', board, 'nested-import')
  await importBoard(test.db, 'alice', 'a', board, 'nested-import')
  expect((await readBoard(test.db, 'alice', 'a')).data.cards).toHaveLength(12)
})
