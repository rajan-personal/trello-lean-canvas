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

export type TicketListSortKey = 'project' | 'status'
export type TicketListSortDirection = 'ascending' | 'descending'
export interface TicketListSort {
  key: TicketListSortKey
  direction: TicketListSortDirection
}
export interface TicketListRow {
  projectId: string
  projectName: string
  status: string
  card: BoardSummaryCard
  sourceOrder: number
}
interface TicketListProjectSummary {
  canvas: { id: string; name: string }
  summary?: BoardSummary
}

export function summaryTickets(projects: readonly TicketListProjectSummary[]): TicketListRow[] {
  let sourceOrder = 0
  return projects.flatMap(({ canvas, summary }) => {
    if (!summary) return []
    return summary.columns.flatMap((column) => orderedSummaryCards(summary, column.id).map((card) => ({
      projectId: canvas.id,
      projectName: canvas.name,
      status: column.title,
      card,
      sourceOrder: sourceOrder++,
    })))
  })
}

function compareText(left: string, right: string): number {
  const compared = left.localeCompare(right, undefined, { sensitivity: 'base' })
  if (compared) return compared
  if (left === right) return 0
  return left < right ? -1 : 1
}

function compareStableTicketOrder(left: TicketListRow, right: TicketListRow): number {
  return left.sourceOrder - right.sourceOrder ||
    compareText(left.projectName, right.projectName) ||
    compareText(left.projectId, right.projectId) ||
    compareText(left.status, right.status) ||
    compareText(left.card.rank, right.card.rank) ||
    compareText(left.card.id, right.card.id) ||
    compareText(left.card.title, right.card.title) ||
    compareText(left.card.columnId, right.card.columnId)
}

export function compareTicketListRows(left: TicketListRow, right: TicketListRow, sort: TicketListSort): number {
  const leftValue = sort.key === 'project' ? left.projectName : left.status
  const rightValue = sort.key === 'project' ? right.projectName : right.status
  const primary = compareText(leftValue, rightValue)
  if (primary) return sort.direction === 'ascending' ? primary : -primary
  return compareStableTicketOrder(left, right)
}

export function sortTicketListRows(rows: readonly TicketListRow[], sort: TicketListSort): TicketListRow[] {
  return [...rows].sort((left, right) => compareTicketListRows(left, right, sort))
}
