import { useId, useState } from 'react'
import { AlignLeft, Trash2 } from 'lucide-react'
import type { AppUser } from '../../auth/auth-context'
import type { RegisterDraftGuard } from '../../app/useNavigationGuard'
import { type BoardCard, type BoardData } from '../../data/board'
import { orderedComments } from '../../data/board-mutations'
import { BoardDialog } from './BoardDialog'
import { BoardComments } from './BoardComments'
import { BoardCardStatus } from './BoardCardStatus'
import { BoardCardStoryPoints } from './BoardCardStoryPoints'
import { useGrowingDescription } from './useGrowingDescription'
import type { RunBoardCommand } from './board-ui'
import { useBoardCardDraft } from './useBoardCardDraft'
import { useDraftGuard } from './useDraftGuard'
import { TicketChildren } from './TicketChildren'
import { TicketBreadcrumbs } from './TicketBreadcrumbs'
import { ticketAncestors } from '../../data/ticket-hierarchy'
import './card-details.css'
interface Props {
  navigationGuarded?: boolean
  deleted?: boolean
  onOpenTicket?: (id: string) => void
  onOpenBoard?: (id: string | null) => void
  card: BoardCard; board: BoardData; user: AppUser; pending: boolean; error: string | null
  run: RunBoardCommand; onClose: () => void; register: RegisterDraftGuard
}
export function BoardCardDialog({ card, board, user, pending, deleted, error, run, onClose, register, onOpenTicket, onOpenBoard, navigationGuarded }: Props) {
  const [childTitle, setChildTitle] = useState('')
  const titleId = useId()
  const descriptionId = useId()
  const formId = useId()
  const pointsId = useId()
  const pointsHelpId = useId()
  const editor = useBoardCardDraft(card, user, run)
  const { draft, setDraft } = editor
  const descriptionRef = useGrowingDescription(draft.description)
  const close = useDraftGuard(editor.dirty || !!childTitle, pending, onClose, register)
  const hasChildren = board.cards.some((item) => item.parentTicketId === card.id)
  const navigate = (action: () => void) => {
    if (pending || (!navigationGuarded && (editor.dirty || !!childTitle) && !window.confirm('Discard unsaved changes?'))) return
    action()
  }
  const exists = !deleted && board.cards.some((item) => item.id === card.id)
  return <BoardDialog title="Card details" onClose={close} lightDismiss className="kanban-card-dialog"
    headerContext={<BoardCardStatus columnId={draft.columnId} columns={board.columns} formId={formId}
      disabled={pending || !exists} onChange={(columnId) => setDraft({ ...draft, columnId })} />}
    headerActions={<button className="kanban-danger kanban-dialog-delete" disabled={pending || !exists || hasChildren}
      type="button" aria-label="Delete card" title={hasChildren ? 'Delete child tickets first' : 'Delete card'} onClick={async () => {
        if (!window.confirm(`Delete “${card.title}” and all its comments?${editor.dirty || childTitle ? ' Unsaved changes will also be discarded.' : ''}`)) return
        if (await run({ type: 'delete-card', id: card.id })) onClose()
      }}><Trash2 size={17} aria-hidden="true" /></button>}>
    {pending && <p role="status">Saving changes…</p>}
    {error && <p role="alert" className="kanban-error">{error}</p>}
    {deleted && <p role="alert">This canvas was deleted elsewhere. Copy your draft before closing.</p>}
    {!deleted && !exists && <p role="alert">This card was deleted elsewhere. Copy your draft before closing.</p>}
    {editor.message && <p role="status">{editor.message}</p>}
    <div className="kanban-card-layout">
    <div className="kanban-card-editor">
    {onOpenTicket && onOpenBoard && card.parentTicketId && <TicketBreadcrumbs cards={ticketAncestors(board.cards, card.id)}
      onBoard={(id) => navigate(() => onOpenBoard(id))} onTicket={(id) => navigate(() => onOpenTicket(id))} disabled={pending} />}
    <form id={formId} onSubmit={async (event) => {
      event.preventDefault()
      if (!pending && exists && draft.title.trim() && await editor.save() && !editor.comment && !childTitle) onClose()
    }}>
      <fieldset disabled={pending}>
        <div className="kanban-title-field"><label htmlFor={titleId}>Title</label><textarea id={titleId} name="title" rows={2} required maxLength={500} readOnly={!exists} value={draft.title}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault(); event.currentTarget.form?.requestSubmit()
            }
          }} onChange={(event) => setDraft({ ...draft, title: event.target.value.replace(/\r?\n/g, ' ') })} /></div>
        <div className="kanban-description-field">
          <div className="kanban-description-heading">
            <label htmlFor={descriptionId}><AlignLeft size={17} aria-hidden="true" /> Description</label>
            <BoardCardStoryPoints id={pointsId} helpId={pointsHelpId} value={draft.storyPoints ?? null}
              disabled={!exists} onChange={(storyPoints) => setDraft({ ...draft, storyPoints })} />
          </div>
          <textarea id={descriptionId} ref={descriptionRef} name="description" rows={6} placeholder="Add a more detailed description…" maxLength={100000} readOnly={!exists} value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </div>
        <div className="kanban-actions">
          <button type="submit" className="kanban-primary" disabled={!exists || !draft.title.trim()}>Save</button>
          <button type="button" onClick={close}>Cancel</button>
          {editor.fieldsDirty && <span className="kanban-draft-indicator">Unsaved changes</span>}
        </div>
      </fieldset>
    </form>
    {onOpenTicket && onOpenBoard && <TicketChildren card={card} board={board} pending={pending} deleted={!exists}
      error={error} run={run} title={childTitle} onTitle={setChildTitle}
      onOpenTicket={(id) => navigate(() => onOpenTicket(id))}
      onOpenBoard={() => navigate(() => onOpenBoard(card.id))} />}
    </div>
    <BoardComments comments={orderedComments(board, card.id)} text={editor.comment}
      onText={editor.setComment} pending={pending} readOnly={!exists} onAdd={editor.addComment} />
    </div>
  </BoardDialog>
}
