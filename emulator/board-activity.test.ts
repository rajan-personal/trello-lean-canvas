import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { boardPath, initializeBoard, mutateBoard, readBoard, readBoardSummary } from '../src/data/board-firestore'
import { finishCardDeletion, startCardDeletion } from '../src/data/board-firestore-delete'
import { activityDay, ACTIVITY_TIME_ZONE } from '../src/data/board-activity'
import { comment } from '../unit/board-fixtures'
import { boardTestEnvironment } from './board-fixtures'

let test: Awaited<ReturnType<typeof boardTestEnvironment>>
beforeAll(async () => { test = await boardTestEnvironment('lean-board-activity-test') })
beforeEach(async () => { await test.seed(); await initializeBoard(test.db, 'alice', 'a') })
afterAll(async () => { await test.cleanup() })

it('records committed changes, not no-ops, stale failures, comments, or repeated deletion recovery', async () => {
  expect((await readBoardSummary(test.db, 'alice', 'a')).data.activity).toBeUndefined()
  await mutateBoard(test.db, 'alice', 'a', { type: 'create-card', id: 'card-a', title: 'Task', columnId: 'backlog' })
  const source = await readBoard(test.db, 'alice', 'a')
  const card = source.data.cards[0]
  await mutateBoard(test.db, 'alice', 'a', { type: 'edit-card', ...card, expected: card })
  await mutateBoard(test.db, 'alice', 'a', { type: 'rename-column', id: 'backlog', title: 'Ideas' })
  await mutateBoard(test.db, 'alice', 'a', { type: 'add-comment', comment: comment() })
  expect((await readBoardSummary(test.db, 'alice', 'a')).data.activity?.counts).toEqual([0, 0, 0, 0, 0, 0, 1])
  await expect(mutateBoard(test.db, 'alice', 'a', { type: 'edit-card', ...card, title: 'Stale', expected: card }, source)).rejects.toThrow()
  await mutateBoard(test.db, 'alice', 'a', { type: 'move-card', id: 'card-a', columnId: 'todo', index: 0 })
  await startCardDeletion(test.db, 'alice', 'a', 'card-a')
  // Reading recovers an interrupted deletion and logs it just once.
  const recovered = await readBoardSummary(test.db, 'alice', 'a')
  expect(recovered.data.activity).toEqual({ timeZone: ACTIVITY_TIME_ZONE, throughDay: activityDay(), counts: [0, 0, 0, 0, 0, 0, 3] })
  await finishCardDeletion(test.db, 'alice', 'a', 'card-a')
  expect(await readBoardSummary(test.db, 'alice', 'a')).toEqual(recovered)
})

it.each([
  { timeZone: 'Europe/London', throughDay: 1, counts: [0, 0, 0, 0, 0, 0, 0] },
  { throughDay: 1, counts: [1] },
  { throughDay: 1, counts: [-1, 0, 0, 0, 0, 0, 0] },
  { throughDay: 1, counts: [0, 0, 0, 0, 0, 0, 'bad'] },
  { throughDay: 1, counts: [0, 0, 0, 0, 0, 0, 1], extra: true },
])('rejects malformed activity history: %j', async (activity) => {
  const source = await readBoard(test.db, 'alice', 'a')
  await expect(updateDoc(doc(test.db, boardPath('alice', 'a')), {
    revision: source.revision + 1, updatedAt: serverTimestamp(), activity,
  })).rejects.toThrow()
})
