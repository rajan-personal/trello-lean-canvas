import { useId, useState } from 'react'
import { Columns3, Plus } from 'lucide-react'
import type { BoardCard, BoardData } from '../../data/board'
import { storyPointLabel } from '../../data/board'
import type { RunBoardCommand } from './board-ui'
import { orderedCards } from '../../data/board-mutations'
import './ticket-hierarchy.css'

interface Props {
  card: BoardCard; board: BoardData; pending: boolean; deleted: boolean; error: string | null
  run: RunBoardCommand; title: string; onTitle: (title: string) => void
  onOpenTicket: (id: string) => void; onOpenBoard: () => void
}
export function TicketChildren({ card, board, pending, deleted, error, run, title, onTitle, onOpenTicket, onOpenBoard }: Props) {
  const heading = useId()
  const [newId, setNewId] = useState(() => crypto.randomUUID())
  const [adding, setAdding] = useState(false)
  const children = board.columns.flatMap((column) => orderedCards(board, column.id, card.id).map((child) => ({ child, column })))
  const done = children.filter(({ column }) => ['done', 'closed'].includes(column.id) || /^(done|closed)$/i.test(column.title)).length
  const initialColumn = board.columns.find((column) => column.id === 'backlog') ?? board.columns[0]
  return <section className="ticket-children" aria-labelledby={heading}>
    <header><h3 id={heading}>Subtasks{children.length > 0 && <span>{done}/{children.length} done</span>}</h3>
      <button className="ticket-board-link" type="button" disabled={pending || deleted} onClick={onOpenBoard}><Columns3 size={15} aria-hidden="true" />Open board</button>
    </header>
    {children.length > 0 && <ul>{children.map(({ child, column }) => <li key={child.id}>
      <button type="button" className="ticket-child-row" disabled={pending || deleted} onClick={() => onOpenTicket(child.id)}>
        <span className="ticket-child-title">{child.title}</span>
        <span className="ticket-child-status">{column.title}</span>
        {child.storyPoints != null && <span className="kanban-story-points-badge">{storyPointLabel(child.storyPoints)}</span>}
      </button>
    </li>)}</ul>}
    {adding ? <form className="kanban-composer" aria-label="Add child ticket" onSubmit={async (event) => {
      event.preventDefault()
      if (pending || deleted || !initialColumn || !title.trim()) return
      if (await run({ type: 'create-card', id: newId, title: title.trim(), columnId: initialColumn.id, parentTicketId: card.id })) {
        onTitle(''); setAdding(false); setNewId(crypto.randomUUID())
      }
    }}>
      <label>Ticket title<input autoFocus required maxLength={500} value={title} disabled={pending} readOnly={deleted}
        onChange={(event) => onTitle(event.target.value)} /></label>
      {error && <p role="alert" className="kanban-error">{error}</p>}
      <div className="kanban-actions"><button type="submit" className="kanban-primary" disabled={pending || deleted || !title.trim()}>Add ticket</button>
        <button type="button" disabled={pending} onClick={() => {
          if (title && !window.confirm('Discard unsaved changes?')) return
          onTitle(''); setAdding(false)
        }}>Cancel</button></div>
    </form> :
      <button className="ticket-add-child" type="button" disabled={pending || deleted || !initialColumn}
        onClick={() => setAdding(true)}><Plus size={15} aria-hidden="true" />Add ticket</button>}
  </section>
}
