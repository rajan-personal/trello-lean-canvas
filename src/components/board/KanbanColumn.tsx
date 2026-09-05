import { useId } from 'react'
import type { RegisterDraftGuard } from '../../app/useNavigationGuard'
import { BoardInlineComposer } from './BoardInlineComposer'
import type { BoardCard, BoardColumn } from '../../data/board'
import { BoardColumnMenu } from './BoardColumnMenu'
import type { RunBoardCommand } from './board-ui'
import type { useBoardDrag } from './useBoardDrag'

interface Props {
  column: BoardColumn; cards: BoardCard[]; index: number; count: number; pending: boolean
  deleted?: boolean; error: string | null; register: RegisterDraftGuard
  adding: boolean; onAddingChange: (adding: boolean) => void
  run: RunBoardCommand; drag: ReturnType<typeof useBoardDrag>
  onOpen: (card: BoardCard) => void; onRename: () => void
}
export function KanbanColumn({ column, cards, index, count, pending, deleted, error, register, run, drag,
  onOpen, onRename, adding, onAddingChange }: Props) {
  const label = useId()
  return <section className="kanban-column" aria-labelledby={label}
    data-drop-target={drag.target === column.id || undefined}
    onDragOver={(event) => drag.over(event, column.id)}
    onDrop={(event) => drag.drop(event, column.id)}>
    <header><h2 id={label}>{column.title}</h2>
      <span className="kanban-column-count" aria-label={`${cards.length} ${cards.length === 1 ? 'card' : 'cards'}`}>{cards.length}</span>
      <BoardColumnMenu column={column} index={index} count={count} empty={!cards.length}
        pending={pending || !!deleted} rename={onRename} run={run} />
    </header>
    <ol className="kanban-cards" aria-label={`${column.title} cards`}>
      {cards.map((card) => <li key={card.id}>
        <button className="kanban-card" type="button" disabled={pending || deleted} draggable={!pending && !deleted}
          onDragStart={(event) => drag.start(event, card.id)} onDragEnd={drag.end}
          onDrop={(event) => drag.drop(event, column.id, card.id)}
          onClick={() => onOpen(card)}>{card.title}</button>
      </li>)}
    </ol>
    {adding ? <BoardInlineComposer kind="card" pending={pending} deleted={deleted} error={error} register={register}
      onClose={() => onAddingChange(false)} onSave={(id, title) => run({ type: 'create-card', id, columnId: column.id, title })} /> :
      <button className="kanban-add-card" disabled={pending || deleted} onClick={() => onAddingChange(true)}>+ Add a card</button>}
  </section>
}
