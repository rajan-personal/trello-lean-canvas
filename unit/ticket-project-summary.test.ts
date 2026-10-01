import { describe, expect, it } from 'vitest'
import { defaultBoardColumns, type BoardSummary } from '../src/data/board'
import { projectActiveTickets, projectTicketCounts } from '../src/data/ticket-project-summary'

const card = (id: string, columnId: string) => ({ id, columnId, title: id, rank: id })
describe('projectTicketCounts', () => {
  it('counts only todo, in-progress, and review cards', () => {
    expect(projectTicketCounts({ columns: defaultBoardColumns, cards: [
      card('a', 'backlog'), card('b', 'backlog'), card('c', 'todo'), card('d', 'review'),
      card('e', 'in-progress'), card('f', 'done'), card('g', 'closed'),
    ] })).toEqual({ todo: 1, 'in-progress': 1, review: 1 })
  })
  it('supports custom column ids and normalized status labels', () => {
    const columns = ['In Progress', 'To do', 'In Review', 'in-review', 'Review', 'Needs approval'].map((title, i) => ({ id: `custom-${i}`, title }))
    const summary: BoardSummary = { columns, cards: columns.map(({ id }, i) => card(String(i), id)) }
    expect(projectTicketCounts(summary)).toEqual({ todo: 1, 'in-progress': 1, review: 3 })
  })
  it('uses stable standard column ids when renamed', () => {
    expect(projectTicketCounts({ columns: [{ id: 'review', title: 'Quality check' }], cards: [card('a', 'review')] })).toEqual({ todo: 0, 'in-progress': 0, review: 1 })
  })
  it('returns zeros for an empty or missing summary without mutating data', () => {
    const summary = Object.freeze({ columns: [], cards: [] })
    expect(projectTicketCounts(summary)).toEqual({ todo: 0, 'in-progress': 0, review: 0 })
    expect(projectTicketCounts()).toEqual({ todo: 0, 'in-progress': 0, review: 0 })
  })
})

it('excludes terminal and backlog ids even when renamed to an active label', () => {
  const columns = ['backlog', 'done', 'closed'].map(id => ({ id, title: 'Todo' }))
  expect(projectActiveTickets({ columns, cards: columns.map(({ id }) => card(id, id)) })).toEqual([])
})
it('orders active tickets by status and rank without mutating summaries', () => {
  const summary = { columns: defaultBoardColumns, cards: [card('z', 'review'), card('b', 'todo'), card('c', 'in-progress'), card('a', 'todo')] }
  expect(projectActiveTickets(summary).map(({ id }) => id)).toEqual(['a', 'b', 'c', 'z'])
  expect(summary.cards.map(({ id }) => id)).toEqual(['z', 'b', 'c', 'a'])
})
