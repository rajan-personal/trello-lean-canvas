import { useState } from 'react'
import type { AppUser } from '../../auth/auth-context'
import type { RegisterDraftGuard } from '../../app/useNavigationGuard'
import type { BoardCard, BoardColumn, BoardData } from '../../data/board'
import { orderedCards } from '../../data/board-mutations'
import { BoardCardDialog } from './BoardCardDialog'
import { BoardTitleDialog } from './BoardTitleDialog'
import { BoardInlineComposer } from './BoardInlineComposer'
import { KanbanColumn } from './KanbanColumn'
import type { RunBoardCommand } from './board-ui'
import { useBoardDrag } from './useBoardDrag'
import './kanban.css'

type Editor = { type: 'card'; card: BoardCard } | { type: 'rename-column'; column: BoardColumn }
interface Props {
  board: BoardData; user: AppUser; pending: boolean; deleted?: boolean; error: string | null
  run: RunBoardCommand; register: RegisterDraftGuard
}
export function KanbanBoard({ board, user, pending, deleted, error, run, register }: Props) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [composingColumns, setComposingColumns] = useState<BoardColumn[]>([])
  const removedColumns = composingColumns.filter((column) => !board.columns.some((item) => item.id === column.id))
  const drag = useBoardDrag(board, pending || !!deleted, run)
  const close = () => setEditor(null)
  return <>
    <div className="kanban-lists" aria-label="Board columns">
      {[...board.columns, ...removedColumns].map((column, index) => <KanbanColumn key={column.id} column={column}
        cards={orderedCards(board, column.id)} index={index} count={board.columns.length}
        adding={composingColumns.some((item) => item.id === column.id)}
        onAddingChange={(adding) => setComposingColumns((current) => adding ? [...current, column] :
          current.filter((item) => item.id !== column.id))}
        pending={pending} deleted={deleted || index >= board.columns.length}
        error={index >= board.columns.length ? 'This column was deleted elsewhere. Copy your draft before dismissing it.' : error}
        register={register} run={run} drag={drag}
        onOpen={(card) => setEditor({ type: 'card', card })}
        onRename={() => setEditor({ type: 'rename-column', column })} />)}
      <div className="kanban-add-column">
        {addingColumn ? <BoardInlineComposer kind="column" pending={pending} deleted={deleted} error={error}
          register={register} onClose={() => setAddingColumn(false)}
          onSave={(id, title) => run({ type: 'create-column', id, title })} /> :
          <button disabled={pending || deleted || board.columns.length >= 100}
            onClick={() => setAddingColumn(true)}>+ Add another column</button>}
      </div>
    </div>
    {editor?.type === 'card' && <BoardCardDialog key={editor.card.id}
      card={board.cards.find((card) => card.id === editor.card.id) ?? editor.card}
      board={board} user={user} pending={pending} deleted={deleted} error={error} run={run} register={register} onClose={close} />}
    {editor?.type === 'rename-column' && <BoardTitleDialog heading="Rename column" initial={editor.column.title}
      pending={pending} deleted={deleted} error={error} register={register}
      onSave={(title) => run({ type: 'rename-column', id: editor.column.id, title })} onClose={close} />}
  </>
}
