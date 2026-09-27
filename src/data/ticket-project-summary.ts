import type { BoardSummary } from './board'

export const ticketCountStatuses = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'Todo' },
  { id: 'review', label: 'In Review' },
] as const
export type TicketCountStatus = typeof ticketCountStatuses[number]['id']

function countStatus(value: string): TicketCountStatus | undefined {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, '')
  if (normalized === 'backlog') return 'backlog'
  if (normalized === 'todo') return 'todo'
  if (normalized === 'review' || normalized === 'inreview') return 'review'
  return undefined
}

export function projectTicketCounts(summary?: BoardSummary): Record<TicketCountStatus, number> {
  const counts = { backlog: 0, todo: 0, review: 0 }
  if (!summary) return counts
  const statuses = new Map(summary.columns.map((column) => [column.id, countStatus(column.id) ?? countStatus(column.title)]))
  for (const card of summary.cards) {
    const status = statuses.get(card.columnId)
    if (status) counts[status]++
  }
  return counts
}
