import { describe, expect, it } from 'vitest'
import { boardCardSchema, storyPointValues } from '../src/data/board'
import { applyBoardCommand } from '../src/data/board-mutations'
import { readLocalBoards, writeLocalBoards } from '../src/data/board-storage'
import { canvasToYaml, yamlToCanvasBundle } from '../src/data/yaml'
import { MemoryStorage, populatedBoard } from './board-fixtures'
import { canvas } from './fixtures'

describe('story points', () => {
  it.each([...storyPointValues, null, undefined])('accepts %s and round-trips storage and YAML', (storyPoints) => {
    const source = populatedBoard()
    const baseline = source.cards[0]
    const board = applyBoardCommand(source, { ...baseline, type: 'edit-card', expected: baseline, storyPoints })
    expect(board.cards[0].storyPoints).toBe(storyPoints)
    const storage = new MemoryStorage()
    writeLocalBoards(storage, { a: board })
    expect(readLocalBoards(storage).a).toEqual(board)
    expect(yamlToCanvasBundle(canvasToYaml(canvas(), board), canvas('new')).board).toEqual(board)
    expect(applyBoardCommand(board, { type: 'move-card', id: baseline.id, columnId: 'done', index: 0 })
      .cards[0].storyPoints).toBe(storyPoints)
  })
  it.each([0, 2, 13.5, -1, 21, '5', '13+', true])('rejects invalid estimate %s', (storyPoints) => {
    expect(boardCardSchema.safeParse({ ...populatedBoard().cards[0], storyPoints }).success).toBe(false)
  })
  it('rejects stale estimates and allows explicit clearing without changing other fields', () => {
    const source = populatedBoard()
    const baseline = source.cards[0]
    const updated = applyBoardCommand(source, { ...baseline, type: 'edit-card', expected: baseline, storyPoints: 8 })
    expect(() => applyBoardCommand(updated, { ...baseline, type: 'edit-card', expected: baseline, title: 'Stale' }))
      .toThrow('changed elsewhere')
    const current = updated.cards[0]
    const cleared = applyBoardCommand(updated, { ...current, type: 'edit-card', expected: current, storyPoints: null })
    expect(cleared.cards[0]).toEqual({ ...baseline, storyPoints: null })
    expect(source.cards[0]).not.toHaveProperty('storyPoints')
  })
})
