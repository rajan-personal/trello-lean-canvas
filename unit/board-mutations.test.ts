import { describe, expect, it } from 'vitest'
import { boardDataSchema, createBoard } from '../src/data/board'
import { applyBoardCommand, orderedCards, rankBetween } from '../src/data/board-mutations'
import { comment, populatedBoard } from './board-fixtures'

describe('board mutations', () => {
  it('initializes independent canonical columns with stable ids', () => {
    expect(createBoard().columns.map(({ title }) => title)).toEqual(['Backlog', 'Todo', 'In Progress', 'Review', 'Done', 'Closed'])
    const first = createBoard()
    first.columns[0].title = 'Changed'
    expect(createBoard().columns[0]).toEqual({ id: 'backlog', title: 'Backlog' })
  })
  it('creates, renames, reorders and deletes empty custom columns', () => {
    let board = applyBoardCommand(createBoard(), { type: 'create-column', id: 'custom', title: 'Custom' })
    board = applyBoardCommand(board, { type: 'rename-column', id: 'custom', title: 'Renamed' })
    board = applyBoardCommand(board, { type: 'move-column', id: 'custom', index: 0 })
    expect(board.columns[0]).toEqual({ id: 'custom', title: 'Renamed' })
    board = applyBoardCommand(board, { type: 'delete-column', id: 'custom' })
    expect(board).toEqual(createBoard())
    expect(() => applyBoardCommand(populatedBoard(), { type: 'delete-column', id: 'backlog' })).toThrow('Only empty')
  })
  it('moves within and across columns without changing card ids, comments or source', () => {
    const source = populatedBoard()
    let board = applyBoardCommand(source, { type: 'move-card', id: 'card-b', columnId: 'backlog', index: 0 })
    expect(orderedCards(board, 'backlog').map(({ id }) => id)).toEqual(['card-b', 'card-a'])
    board = applyBoardCommand(board, { type: 'move-card', id: 'card-a', columnId: 'done', index: 0 })
    expect(orderedCards(board, 'done').map(({ id }) => id)).toEqual(['card-a'])
    expect(board.comments).toEqual(source.comments)
    expect(orderedCards(source, 'backlog').map(({ id }) => id)).toEqual(['card-a', 'card-b'])
  })
  it('saves title/description/column together and stores plain text', () => {
    const board = applyBoardCommand(populatedBoard(), { type: 'edit-card', id: 'card-a', expected: populatedBoard().cards[0], columnId: 'review',
      title: ' Edited ', description: '<script>alert(1)</script>\nPlain text' })
    expect(board.cards[0]).toMatchObject({ id: 'card-a', title: 'Edited', columnId: 'review', description: '<script>alert(1)</script>\nPlain text' })
    expect(() => applyBoardCommand(board, { type: 'edit-card', id: 'card-a', expected: populatedBoard().cards[0], title: ' ', description: '', columnId: 'done' })).toThrow()
  })
  it('keeps author/timestamp and explicitly deletes comments with their card', () => {
    const source = populatedBoard()
    expect(source.comments[0]).toEqual(comment())
    const next = applyBoardCommand(source, { type: 'delete-card', id: 'card-a' })
    expect(next.comments).toEqual([])
    expect(next.cards.map(({ id }) => id)).toEqual(['card-b'])
    expect(() => applyBoardCommand(next, { type: 'add-comment', comment: comment() })).toThrow('Card no longer')
  })
  it('rejects duplicate ids, dangling references and invalid ordering', () => {
    const source = populatedBoard()
    expect(boardDataSchema.safeParse({ ...source, comments: [comment(), comment()] }).success).toBe(false)
    expect(boardDataSchema.safeParse({ ...source, comments: [comment('c', 'missing')] }).success).toBe(false)
    expect(boardDataSchema.safeParse({ ...source, cards: source.cards.map((card) => ({ ...card, rank: 'h' })) }).success).toBe(false)
    expect(() => applyBoardCommand(source, { type: 'move-card', id: 'card-a', columnId: 'missing', index: 0 })).toThrow()
  })
  it('keeps lexical ranks strictly ordered after repeated insertions at either edge or between', () => {
    let lower = rankBetween(), upper = rankBetween(lower)
    for (let i = 0; i < 1000; i++) {
      const middle = rankBetween(lower, upper)
      expect(middle > lower && middle < upper).toBe(true)
      if (i % 2) lower = middle
      else upper = middle
    }
    expect(rankBetween('', lower) < lower).toBe(true)
    expect(rankBetween(upper) > upper).toBe(true)
  })
})
