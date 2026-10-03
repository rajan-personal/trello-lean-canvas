import { describe, expect, it } from 'vitest'
import { boardDataSchema, boardSummary, createBoard, type BoardData } from '../src/data/board'
import { applyBoardCommand, orderedCards } from '../src/data/board-mutations'
import { hierarchyLayers, ticketAncestors } from '../src/data/ticket-hierarchy'
import { projectActiveTickets } from '../src/data/ticket-project-summary'
import { canvasToYaml, yamlToCanvasBundle } from '../src/data/yaml'
import { canvas } from './fixtures'

const add = (board: BoardData, id: string, parentTicketId?: string) => applyBoardCommand(board,
  { type: 'create-card', id, title: id, columnId: 'todo', parentTicketId })
const tree = () => add(add(add(add(createBoard(), 'root'), 'other'), 'child', 'root'), 'grandchild', 'child')

describe('nested tickets', () => {
  it('isolates siblings, ordering and status moves without changing parent status', () => {
    let board = add(tree(), 'sibling', 'root')
    expect(orderedCards(board, 'todo').map(({ id }) => id)).toEqual(['root', 'other'])
    expect(orderedCards(board, 'todo', 'root').map(({ id }) => id)).toEqual(['child', 'sibling'])
    board = applyBoardCommand(board, { type: 'move-card', id: 'sibling', columnId: 'todo', index: 0 })
    expect(orderedCards(board, 'todo', 'root').map(({ id }) => id)).toEqual(['sibling', 'child'])
    board = applyBoardCommand(board, { type: 'move-card', id: 'grandchild', columnId: 'done', index: 0 })
    expect(board.cards.find(({ id }) => id === 'child')?.columnId).toBe('todo')
    expect(orderedCards(board, 'done')).toHaveLength(0)
    expect(orderedCards(board, 'done', 'child')[0].id).toBe('grandchild')
  })
  it('rejects missing parents, cycles, duplicate sibling ranks and deleting non-leaf tickets', () => {
    expect(() => add(createBoard(), 'child', 'missing')).toThrow('no longer exists')
    const board = tree()
    expect(() => applyBoardCommand(board, { type: 'delete-card', id: 'root' })).toThrow('child tickets')
    expect(() => boardDataSchema.parse({ ...board, cards: board.cards.map((card) =>
      card.id === 'root' ? { ...card, parentTicketId: 'grandchild' } : card) })).toThrow('cycle')
    expect(() => boardDataSchema.parse({ ...board, cards: board.cards.map((card) =>
      card.id === 'child' ? { ...card, parentTicketId: 'missing' } : card) })).toThrow('Parent ticket')
    const duplicate = { ...board.cards[0], id: 'duplicate' }
    expect(() => boardDataSchema.parse({ ...board, cards: [...board.cards, duplicate] })).toThrow('ordering')
    const after = applyBoardCommand(board, { type: 'delete-card', id: 'grandchild' })
    expect(after.cards.map(({ id }) => id)).toEqual(['root', 'other', 'child'])
  })
  it('preserves hierarchy in summaries, active-ticket lists and YAML, independent of import order', () => {
    const board = tree()
    const summary = boardSummary(board)
    expect(projectActiveTickets(summary).map(({ id }) => id)).toContain('grandchild')
    expect(ticketAncestors(summary.cards, 'grandchild').map(({ id }) => id)).toEqual(['root', 'child'])
    expect(yamlToCanvasBundle(canvasToYaml(canvas('a'), board), canvas('b')).board).toEqual(board)
    expect(hierarchyLayers([...board.cards].reverse()).map((layer) => layer.map(({ id }) => id)))
      .toEqual([['other', 'root'], ['child'], ['grandchild']])
  })
  it('validates and navigates thousands of levels without recursive calls or a depth cap', () => {
    const cards = Array.from({ length: 10000 }, (_, index) => ({ id: `t${index}`, title: `Ticket ${index}`,
      parentTicketId: index ? `t${index - 1}` : null, columnId: 'todo', description: '', rank: 'h' }))
    const board = boardDataSchema.parse({ ...createBoard(), cards: [...cards].reverse() })
    expect(ticketAncestors(board.cards, 't9999')).toHaveLength(9999)
    expect(hierarchyLayers(board.cards)).toHaveLength(10000)
  })
})
