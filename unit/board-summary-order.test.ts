import { describe, expect, it } from 'vitest'
import type { BoardSummary } from '../src/data/board'
import { sortTicketListRows, summaryGroups, summaryTickets } from '../src/data/board-summary-order'

const summary = (project: string): BoardSummary => ({
  columns: [{ id: `${project}-custom`, title: 'Custom status' }, { id: `${project}-done`, title: 'Done' }, { id: `${project}-empty`, title: 'Empty' }],
  cards: [
    { id: 'shared-card', columnId: `${project}-done`, title: 'Later', rank: 'b' },
    { id: 'first-card', columnId: `${project}-custom`, title: 'First', rank: 'a' },
    { id: 'second-card', columnId: `${project}-custom`, title: 'Second', rank: 'c' },
  ],
})
const sortableProjects = [
  { canvas: { id: 'project-a', name: 'Alpha' }, summary: {
    columns: [{ id: 'z-column', title: 'Alpha status' }, { id: 'a-column', title: 'Zeta status' }],
    cards: [
      { id: 'duplicate-late', columnId: 'z-column', title: 'Duplicate title', rank: 'b' },
      { id: 'duplicate-first', columnId: 'z-column', title: 'Duplicate title', rank: 'a' },
      { id: 'alpha-ticket', columnId: 'a-column', title: 'Alpha ticket', rank: 'a' },
    ],
  } satisfies BoardSummary },
  { canvas: { id: 'project-b', name: 'Beta' }, summary: {
    columns: [{ id: 'b-column', title: 'Beta status' }, { id: 'y-column', title: 'Zeta status' }],
    cards: [
      { id: 'beta-ticket', columnId: 'b-column', title: 'Beta ticket', rank: 'a' },
      { id: 'other-zeta', columnId: 'y-column', title: 'Other ticket', rank: 'a' },
    ],
  } satisfies BoardSummary },
]

describe('board summary order', () => {
  it('keeps custom status and card rank order while omitting empty statuses', () => {
    const groups = summaryGroups(summary('project-a'))
    expect(groups.map(({ column }) => column.title)).toEqual(['Custom status', 'Done'])
    expect(groups[0].cards.map(({ title }) => title)).toEqual(['First', 'Second'])
    expect(groups[1].cards).toHaveLength(1)
  })
  it('allows card ids to repeat across project summaries without changing grouping', () => {
    const first = summaryGroups(summary('project-a'))[1].cards[0]
    const second = summaryGroups(summary('project-b'))[1].cards[0]
    expect(first.id).toBe(second.id)
    expect(first.columnId).not.toBe(second.columnId)
  })
  it('sorts ticket status by displayed names and preserves stable ties', () => {
    const rows = summaryTickets(sortableProjects)
    expect(sortTicketListRows(rows, { key: 'status', direction: 'ascending' }).map(({ status }) => status)).toEqual([
      'Alpha status', 'Alpha status', 'Beta status', 'Zeta status', 'Zeta status',
    ])
    expect(sortTicketListRows(rows, { key: 'status', direction: 'descending' }).map(({ status }) => status)).toEqual([
      'Zeta status', 'Zeta status', 'Beta status', 'Alpha status', 'Alpha status',
    ])
    expect(sortTicketListRows(rows, { key: 'status', direction: 'ascending' }).filter(({ status }) => status === 'Zeta status').map(({ card }) => card.id)).toEqual([
      'alpha-ticket', 'other-zeta',
    ])
  })
  it('sorts projects in both directions without reversing tie order', () => {
    const rows = summaryTickets(sortableProjects)
    expect(sortTicketListRows(rows, { key: 'project', direction: 'ascending' }).map(({ projectName }) => projectName)).toEqual([
      'Alpha', 'Alpha', 'Alpha', 'Beta', 'Beta',
    ])
    expect(sortTicketListRows(rows, { key: 'project', direction: 'descending' }).map(({ projectName }) => projectName)).toEqual([
      'Beta', 'Beta', 'Alpha', 'Alpha', 'Alpha',
    ])
    expect(sortTicketListRows(rows, { key: 'project', direction: 'ascending' }).filter(({ projectName }) => projectName === 'Alpha').map(({ card }) => card.id)).toEqual([
      'duplicate-first', 'duplicate-late', 'alpha-ticket',
    ])
  })
})
