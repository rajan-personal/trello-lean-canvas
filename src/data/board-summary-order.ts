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
  const groups: BoardSummaryGroup[] = []
  summary.columns.forEach((column) => {
    const cards = orderedSummaryCards(summary, column.id); if (cards.length) groups.push({ column, cards })
  })
  return groups
}

export type TicketListSortKey = 'status'
export type TicketListSortDirection = 'ascending' | 'descending'
export interface TicketListSort {
  key: TicketListSortKey
  direction: TicketListSortDirection
}
export interface TicketListRow {
  projectId: string
  projectName: string
  status: string
  statusOrder: number
  card: BoardSummaryCard
  sourceOrder: number
}
export interface TicketListProjectGroup {
  projectId: string
  projectName: string
  rows: TicketListRow[]
}
interface TicketListProjectSummary {
  canvas: { id: string; name: string }
  summary?: BoardSummary
}

export function summaryTickets(projects: readonly TicketListProjectSummary[]): TicketListRow[] {
  let sourceOrder = 0
  return projects.flatMap(({ canvas, summary }) => {
    if (!summary) return []
    return summary.columns.flatMap((column, statusOrder) => orderedSummaryCards(summary, column.id).map((card) => ({
      projectId: canvas.id,
      projectName: canvas.name,
      status: column.title,
      statusOrder,
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
  const primary = left.statusOrder - right.statusOrder || compareText(left.status, right.status)
  if (primary) return sort.direction === 'ascending' ? primary : -primary
  return compareStableTicketOrder(left, right)
}

export function sortTicketListRows(rows: readonly TicketListRow[], sort: TicketListSort): TicketListRow[] {
  return [...rows].sort((left, right) => compareTicketListRows(left, right, sort))
}

export function groupTicketListRows(rows: readonly TicketListRow[], sort: TicketListSort | null = null): TicketListProjectGroup[] {
  const groups = new Map<string, TicketListProjectGroup>()
  // summaryTickets follows sidebar order; filtering must preserve that order.
  for (const row of rows) {
    const group = groups.get(row.projectId) ?? { projectId: row.projectId, projectName: row.projectName, rows: [] }
    group.rows.push(row)
    groups.set(row.projectId, group)
  }
  return [...groups.values()].map((group) => ({
    ...group,
    rows: sort ? sortTicketListRows(group.rows, sort) : group.rows,
  }))
}
