import type { BoardSummary, BoardSummaryCard } from './board'

export interface BoardSummaryGroup {
  column: BoardSummary['columns'][number]
  cards: BoardSummaryCard[]
}
export function orderedSummaryCards(summary: BoardSummary, columnId: string): BoardSummaryCard[] {
  return summary.cards.filter((card) => card.columnId === columnId).sort((a, b) =>
    a.rank.localeCompare(b.rank) || a.id.localeCompare(b.id))
}
export function summaryGroups(summary: BoardSummary): BoardSummaryGroup[] {
  return summary.columns.map((column) => ({ column, cards: orderedSummaryCards(summary, column.id) }))
    .filter(({ cards }) => cards.length > 0)
}
