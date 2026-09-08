import { describe, expect, it } from 'vitest'
import type { BoardSummary } from '../src/data/board'
import { groupTicketListRows, summaryGroups, summaryTickets } from '../src/data/board-summary-order'

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
    columns: [{ id: 'z-column', title: 'Zeta status' }, { id: 'a-column', title: 'Alpha status' }],
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
  it('sorts tickets within each project by workflow column position', () => {
    const rows = summaryTickets(sortableProjects)
    const ascending = groupTicketListRows(rows, { key: 'status', direction: 'ascending' })
    expect(ascending.map(({ rows }) => rows.map(({ status }) => status))).toEqual([
      ['Zeta status', 'Zeta status', 'Alpha status'], ['Beta status', 'Zeta status'],
    ])
    const descending = groupTicketListRows(rows, { key: 'status', direction: 'descending' })
    expect(descending.map(({ rows }) => rows.map(({ status }) => status))).toEqual([
      ['Alpha status', 'Zeta status', 'Zeta status'], ['Zeta status', 'Beta status'],
    ])
  })
  it('preserves sidebar project order through status sorting and filtering', () => {
    const rows = summaryTickets([...sortableProjects].reverse())
    expect(groupTicketListRows(rows).map(({ projectName }) => projectName)).toEqual(['Beta', 'Alpha'])
    for (const direction of ['ascending', 'descending'] as const) {
      const filtered = rows.filter(({ status }) => status === 'Zeta status')
      const groups = groupTicketListRows(filtered, { key: 'status', direction })
      expect(groups.map(({ projectName }) => projectName)).toEqual(['Beta', 'Alpha'])
      expect(groups[1].rows.map(({ card }) => card.id)).toEqual(['duplicate-first', 'duplicate-late'])
    }
    expect(groupTicketListRows(summaryTickets(sortableProjects)).map(({ projectName }) => projectName)).toEqual(['Alpha', 'Beta'])
  })
  it('keeps projects with duplicate names separate in sidebar order', () => {
    const rows = summaryTickets(sortableProjects.map((project) => ({ ...project, canvas: { ...project.canvas, name: 'Same name' } })).reverse())
    expect(groupTicketListRows(rows).map(({ projectId }) => projectId)).toEqual(['project-b', 'project-a'])
  })
})
