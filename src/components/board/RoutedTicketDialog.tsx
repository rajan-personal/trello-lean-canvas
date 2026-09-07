import { useState, type ComponentProps } from 'react'
import { BoardCardDialog } from './BoardCardDialog'

export interface TicketSelection {
  id: string | null
  open: (id: string) => void
  close: () => void
}

type Props = Omit<ComponentProps<typeof BoardCardDialog>, 'card'> & { ticketId: string; loading: boolean }

/** Retain a removed ticket only while its existing editor is open, never as a save target. */
export function RoutedTicketDialog({ ticketId, loading, ...props }: Props) {
  const current = props.board.cards.find(({ id }) => id === ticketId)
  const [retained, setRetained] = useState(current)
  if (current && current !== retained) setRetained(current)
  const card = current ?? retained
  if (card) return <BoardCardDialog {...props} card={card} />
  if (loading || props.error) return null
  return <div role="alert" className="kanban-status">
    This ticket is unavailable. It may have been deleted or you may not have access.
    <button disabled={props.pending} onClick={props.onClose}>Close ticket</button>
  </div>
}
