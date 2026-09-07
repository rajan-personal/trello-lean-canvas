import { describe, expect, it } from 'vitest'
import type { BoardSummary } from '../src/data/board'
import { summaryGroups } from '../src/data/board-summary-order'

const summary = (project: string): BoardSummary => ({
  columns: [{ id: `${project}-custom`, title: 'Custom status' }, { id: `${project}-done`, title: 'Done' }, { id: `${project}-empty`, title: 'Empty' }],
  cards: [
    { id: 'shared-card', columnId: `${project}-done`, title: 'Later', rank: 'b' },
    { id: 'first-card', columnId: `${project}-custom`, title: 'First', rank: 'a' },
    { id: 'second-card', columnId: `${project}-custom`, title: 'Second', rank: 'c' },
  ],
})

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
})
