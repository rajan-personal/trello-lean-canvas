import { defaultBoardColumns, type BoardSummary } from './board'

export const ticketCountStatuses = [
  { id: 'todo', label: 'Todo' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'In Review' },
] as const
export type TicketCountStatus = typeof ticketCountStatuses[number]['id']

function countStatus(value: string): TicketCountStatus | undefined {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, '')
  if (normalized === 'todo') return 'todo'
  if (normalized === 'inprogress') return 'in-progress'
  if (normalized === 'review' || normalized === 'inreview') return 'review'
  return undefined
}

export function projectActiveTickets(summary?: BoardSummary) {
  if (!summary) return []
  // Standard ids remain authoritative even when a column is renamed.
  const statuses = new Map(summary.columns.map((column) => [column.id,
    countStatus(defaultBoardColumns.some(({ id }) => id === column.id) ? column.id : column.title)]))
  return summary.cards.flatMap((card) => {
    const status = statuses.get(card.columnId)
    return status ? [{ ...card, status }] : []
  }).sort((a, b) => ticketCountStatuses.findIndex(({ id }) => id === a.status)
    - ticketCountStatuses.findIndex(({ id }) => id === b.status)
    || (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : a.id.localeCompare(b.id)))
}

export function projectTicketCounts(summary?: BoardSummary): Record<TicketCountStatus, number> {
  const counts = { todo: 0, 'in-progress': 0, review: 0 }
  for (const { status } of projectActiveTickets(summary)) counts[status]++
  return counts
}
