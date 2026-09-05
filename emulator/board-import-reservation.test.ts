import { doc, getDocFromServer } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { boardPath, importBoard, initializeBoard, mutateBoard, readBoard } from '../src/data/board-firestore'
import { saveCanvasDiff } from '../src/data/firestore-writes'
import { initializeWorkspace } from '../src/data/firestore-migration'
import { migrationCanvases } from '../src/data/firestore-model'
import { populatedBoard } from '../unit/board-fixtures'
import { canvas } from '../unit/fixtures'
import { boardTestEnvironment } from './board-fixtures'

let test: Awaited<ReturnType<typeof boardTestEnvironment>>
beforeAll(async () => { test = await boardTestEnvironment('lean-board-reservation-test') })
beforeEach(async () => { await test.seed() })
afterAll(async () => { await test.cleanup() })
describe('atomic board import publication', () => {
  it('reserves before another session initializes and recovers after publisher interruption', async () => {
    const base = await test.seed()
    const imported = canvas('imported')
    const source = populatedBoard()
    const pending = { canvas: imported, board: source, importId: 'import-id' }
    const next = [...base.canvases, imported]
    const saved = await saveCanvasDiff(test.db, 'alice', base, next, [pending])
    // Session B sees the new canvas before session A starts copying records.
    await initializeBoard(test.db, 'alice', imported.id)
    const ref = doc(test.db, boardPath('alice', imported.id))
    expect((await getDocFromServer(ref)).data()).toMatchObject({ status: 'importing', importId: 'import-id' })
    await expect(readBoard(test.db, 'alice', imported.id)).rejects.toThrow('importing')
    // Reloaded session A retries publication and completes the retained import.
    await saveCanvasDiff(test.db, 'alice', saved, next, [pending])
    await importBoard(test.db, 'alice', imported.id, source, pending.importId)
    expect((await readBoard(test.db, 'alice', imported.id)).data).toEqual(source)
    const baseline = source.cards[0]
    await mutateBoard(test.db, 'alice', imported.id, { ...baseline, type: 'edit-card', expected: baseline, title: 'User edit' })
    await saveCanvasDiff(test.db, 'alice', saved, next, [pending])
    await importBoard(test.db, 'alice', imported.id, source, pending.importId)
    expect((await readBoard(test.db, 'alice', imported.id)).data.cards[0].title).toBe('User edit')
  })
  it('does not replace a different existing board or publish the conflicting canvas edit', async () => {
    const base = await test.seed()
    await initializeBoard(test.db, 'alice', 'a')
    await expect(saveCanvasDiff(test.db, 'alice', base, [{ ...canvas('a'), name: 'Changed' }, canvas('b')],
      [{ canvas: canvas('a'), board: populatedBoard(), importId: 'other' }])).rejects.toThrow('different board')
    expect((await getDocFromServer(doc(test.db, 'users/alice/workspaces/default/canvases/a'))).data()?.name).toBe('Test canvas')
    expect((await readBoard(test.db, 'alice', 'a')).data.cards).toEqual([])
  })
  it('reserves migrated local boards before publication and preserves retry sources', async () => {
    await test.environment.clearFirestore()
    const local = Array.from({ length: 10 }, (_, index) => canvas(`local-${index}`))
    const boards = Object.fromEntries(local.map(({ id }) => [id, populatedBoard()]))
    expect(await initializeWorkspace(test.db, 'alice', local, boards)).toEqual({ consumedLocal: true })
    const migrated = await migrationCanvases(local)
    for (const item of migrated) await initializeBoard(test.db, 'alice', item.id)
    expect(await initializeWorkspace(test.db, 'alice', local, boards)).toEqual({ consumedLocal: true })
    for (const item of migrated) {
      await expect(readBoard(test.db, 'alice', item.id)).rejects.toThrow('importing')
      await importBoard(test.db, 'alice', item.id, populatedBoard(), `local-migration-${item.id}`)
      expect((await readBoard(test.db, 'alice', item.id)).data).toEqual(populatedBoard())
    }
  })
})
