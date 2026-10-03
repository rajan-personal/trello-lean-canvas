import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AppUser } from '../../auth/auth-context'
import type { RegisterDraftGuard } from '../../app/useNavigationGuard'
import type { BoardCard, BoardColumn, BoardData } from '../../data/board'
import { ticketAncestors } from '../../data/ticket-hierarchy'
import { TicketBreadcrumbs } from './TicketBreadcrumbs'
import { orderedCards } from '../../data/board-mutations'
import { RoutedTicketDialog, type TicketSelection } from './RoutedTicketDialog'
import { BoardCardDialog } from './BoardCardDialog'
import { BoardTitleDialog } from './BoardTitleDialog'
import { BoardInlineComposer } from './BoardInlineComposer'
import { KanbanColumn } from './KanbanColumn'
import type { RunBoardCommand } from './board-ui'
import { useBoardDrag } from './useBoardDrag'
import { useComposerFocus } from './useComposerFocus'
import './kanban.css'

type Editor = { type: 'card'; card: BoardCard } | { type: 'rename-column'; column: BoardColumn }
interface Props {
  board: BoardData; user: AppUser; pending: boolean; deleted?: boolean; error: string | null
  ticket?: TicketSelection; loading?: boolean
  run: RunBoardCommand; register: RegisterDraftGuard
}
export function KanbanBoard({ board, user, pending, deleted, error, run, register, ticket, loading = false }: Props) {
  const lists = useRef<HTMLDivElement>(null)
  const initialBoard = useRef(board)
  useLayoutEffect(() => {
    if (board !== initialBoard.current) lists.current?.classList.remove('is-entering')
  }, [board])
  useEffect(() => {
    const timer = setTimeout(() => lists.current?.classList.remove('is-entering'), 200)
    return () => clearTimeout(timer)
  }, [])
  const [editor, setEditor] = useState<Editor | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const composer = useComposerFocus(addingColumn)
  const [composingColumns, setComposingColumns] = useState<BoardColumn[]>([])
  const removedColumns = composingColumns.filter((column) => !board.columns.some((item) => item.id === column.id))
  const [localParent, setLocalParent] = useState<string | null>(null)
  const parentId = ticket?.parentId ?? (ticket?.id ? board.cards.find((card) => card.id === ticket.id)?.parentTicketId : localParent) ?? null
  const parent = board.cards.find((card) => card.id === parentId)
  const scopedBoard = { ...board, cards: board.cards.filter((card) => (card.parentTicketId ?? null) === parentId) }
  const scopedRun: RunBoardCommand = (command) => run(command.type === 'create-card'
    ? { ...command, parentTicketId: parentId } : command)
  const openCard = (id: string) => {
    if (ticket) ticket.open(id)
    else { const card = board.cards.find((item) => item.id === id); if (card) setEditor({ type: 'card', card }) }
  }
  const openBoard = (id: string | null) => {
    if (ticket?.board) ticket.board(id)
    else { setEditor(null); setLocalParent(id) }
  }
  const drag = useBoardDrag(scopedBoard, pending || !!deleted, run, parentId)
  const childProgress: Record<string, { done: number; total: number }> = {}
  const done = new Set(board.columns.filter((column) => ['done', 'closed'].includes(column.id) || /^(done|closed)$/i.test(column.title)).map((column) => column.id))
  for (const card of board.cards) if (card.parentTicketId) {
    const progress = childProgress[card.parentTicketId] ??= { done: 0, total: 0 }
    progress.total++
    if (done.has(card.columnId)) progress.done++
  }
  const commentCounts: Record<string, number> = {}
  for (const comment of board.comments) commentCounts[comment.cardId] = (commentCounts[comment.cardId] ?? 0) + 1
  const close = () => setEditor(null)
  return <>
    {parentId && <TicketBreadcrumbs cards={parent ? [...ticketAncestors(board.cards, parentId), parent] : []}
      currentId={parentId} onCurrent={() => openCard(parentId)} onBoard={openBoard} disabled={pending || deleted} />}
    {parentId && !parent ? <p role="alert" className="kanban-status">This parent ticket is unavailable.</p> : <div ref={lists} className="kanban-lists is-entering" aria-label="Board columns">
      {[...board.columns, ...removedColumns].map((column, index) => <KanbanColumn key={column.id} column={column}
        cards={orderedCards(board, column.id, parentId)} commentCounts={commentCounts} childProgress={childProgress} columnEmpty={!board.cards.some((card) => card.columnId === column.id)} index={index} count={board.columns.length}
        adding={composingColumns.some((item) => item.id === column.id)}
        onAddingChange={(adding) => setComposingColumns((current) => adding ? [...current, column] :
          current.filter((item) => item.id !== column.id))}
        pending={pending} deleted={deleted || index >= board.columns.length}
        error={index >= board.columns.length ? 'This column was deleted elsewhere. Copy your draft before dismissing it.' : error}
        register={register} run={scopedRun} drag={drag}
        onOpen={(card) => ticket ? ticket.open(card.id) : setEditor({ type: 'card', card })}
        onRename={() => setEditor({ type: 'rename-column', column })} />)}
      <div ref={composer} className="kanban-add-column">
        {addingColumn ? <BoardInlineComposer kind="column" pending={pending} deleted={deleted} error={error}
          register={register} onClose={() => setAddingColumn(false)}
          onSave={(id, title) => run({ type: 'create-column', id, title })} /> :
          <button disabled={pending || deleted || board.columns.length >= 100}
            onClick={() => setAddingColumn(true)}>+ Add another column</button>}
      </div>
    </div>}
    {ticket?.id && <RoutedTicketDialog key={ticket.id} ticketId={ticket.id} loading={loading}
      board={board} user={user} pending={pending} deleted={deleted} error={error} run={run} register={register} onClose={ticket.close} navigationGuarded onOpenTicket={openCard} onOpenBoard={openBoard} />}
    {editor?.type === 'card' && <BoardCardDialog key={editor.card.id}
      card={board.cards.find((card) => card.id === editor.card.id) ?? editor.card}
      board={board} user={user} pending={pending} deleted={deleted} error={error} run={run} register={register} onClose={close} onOpenTicket={openCard} onOpenBoard={openBoard} />}
    {editor?.type === 'rename-column' && <BoardTitleDialog heading="Rename column" initial={editor.column.title}
      pending={pending} deleted={deleted} missing={!board.columns.some(({ id }) => id === editor.column.id)}
      error={error} register={register}
      onSave={(title) => run({ type: 'rename-column', id: editor.column.id, title })} onClose={close} />}
  </>
}
