import { useId } from 'react'
import { AlignLeft, MessageSquare, Plus } from 'lucide-react'
import type { RegisterDraftGuard } from '../../app/useNavigationGuard'
import { BoardInlineComposer } from './BoardInlineComposer'
import { storyPointLabel, type BoardCard, type BoardColumn } from '../../data/board'
import { BoardColumnMenu } from './BoardColumnMenu'
import { useComposerFocus } from './useComposerFocus'
import type { RunBoardCommand } from './board-ui'
import type { useBoardDrag } from './useBoardDrag'

interface Props {
  column: BoardColumn; cards: BoardCard[]; index: number; count: number; pending: boolean
  commentCounts: Readonly<Record<string, number>>
  deleted?: boolean; error: string | null; register: RegisterDraftGuard
  adding: boolean; onAddingChange: (adding: boolean) => void
  run: RunBoardCommand; drag: ReturnType<typeof useBoardDrag>
  onOpen: (card: BoardCard) => void; onRename: () => void
}
export function KanbanColumn({ column, cards, commentCounts, index, count, pending, deleted, error, register, run, drag,
  onOpen, onRename, adding, onAddingChange }: Props) {
  const label = useId()
  const composer = useComposerFocus(adding)
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
      {cards.map((card) => {
        const commentCount = commentCounts[card.id] ?? 0
        const hasDescription = Boolean(card.description.trim())
        const summary = [hasDescription ? 'Has description.' : '', commentCount > 0
          ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}.` : ''].filter(Boolean).join(' ')
        const metaId = `${label}-${card.id}-meta`
        return <li key={card.id}>
        <button className="kanban-card" type="button" disabled={pending || deleted} draggable={!pending && !deleted}
          aria-label={card.storyPoints == null ? undefined : `${card.title} ${storyPointLabel(card.storyPoints)} story ${card.storyPoints === 1 ? 'point' : 'points'}`}
          aria-describedby={summary ? metaId : undefined}
          onDragStart={(event) => drag.start(event, card.id)} onDragEnd={drag.end}
          onDrop={(event) => drag.drop(event, column.id, card.id)}
          onClick={() => onOpen(card)}>{card.title}{(hasDescription || commentCount > 0 || card.storyPoints != null) &&
            <span className="kanban-card-meta" aria-hidden="true">
              {hasDescription && <AlignLeft size={14} />}
              {commentCount > 0 && <span><MessageSquare size={14} />{commentCount}</span>}
              {card.storyPoints != null && <span className="kanban-story-points-badge" aria-hidden="true">
                {storyPointLabel(card.storyPoints)}
              </span>}
            </span>}</button>
        {summary && <span id={metaId} className="sr-only">{summary}</span>}
      </li>})}
    </ol>
    <div ref={composer}>{adding ? <BoardInlineComposer kind="card" pending={pending} deleted={deleted} error={error} register={register}
      onClose={() => onAddingChange(false)} onSave={(id, title) => run({ type: 'create-card', id, columnId: column.id, title })} /> :
      <button className="kanban-add-card" disabled={pending || deleted} onClick={() => onAddingChange(true)}><Plus size={16} aria-hidden="true" />Add a card</button>}</div>
  </section>
}
