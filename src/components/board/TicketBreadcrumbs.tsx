import type { BoardCard } from '../../data/board'
import './ticket-hierarchy.css'

interface Props {
  cards: readonly Pick<BoardCard, 'id' | 'title'>[]
  currentId?: string
  onCurrent?: () => void
  onBoard: (id: string | null) => void
  onTicket?: (id: string) => void
  disabled?: boolean
}
export function TicketBreadcrumbs({ cards, currentId, onBoard, onTicket, onCurrent, disabled }: Props) {
  return <nav className="ticket-breadcrumbs" aria-label="Ticket hierarchy">
    <button type="button" disabled={disabled} onClick={() => onBoard(null)}>Project board</button>
    {cards.map((card) => <span key={card.id}>
      <span aria-hidden="true">/</span>
      <button type="button" disabled={disabled || (card.id === currentId && !onCurrent)} aria-current={card.id === currentId ? 'page' : undefined}
        title={card.title} onClick={() => card.id === currentId && onCurrent ? onCurrent() : onTicket ? onTicket(card.id) : onBoard(card.id)}>{card.title}</button>
    </span>)}
  </nav>
}
