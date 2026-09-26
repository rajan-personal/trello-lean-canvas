import type { BoardCard, BoardData } from '../../data/board'

export function BoardCardStatus({ card, board }: { card: BoardCard; board: BoardData }) {
  const title = board.columns.find(({ id }) => id === card.columnId)?.title ?? 'Unavailable'
  return <span className="kanban-task-status" title={title}>
    <span className="kanban-task-status-dot" aria-hidden="true" />
    <span className="kanban-task-status-label">{title}</span>
  </span>
}
