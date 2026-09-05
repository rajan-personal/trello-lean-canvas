import { useId } from 'react'
import { AlignLeft, Trash2 } from 'lucide-react'
import type { AppUser } from '../../auth/auth-context'
import type { RegisterDraftGuard } from '../../app/useNavigationGuard'
import type { BoardCard, BoardData } from '../../data/board'
import { orderedComments } from '../../data/board-mutations'
import { BoardDialog } from './BoardDialog'
import { BoardComments } from './BoardComments'
import { useGrowingDescription } from './useGrowingDescription'
import type { RunBoardCommand } from './board-ui'
import { useBoardCardDraft } from './useBoardCardDraft'
import { useDraftGuard } from './useDraftGuard'

interface Props {
  deleted?: boolean
  card: BoardCard; board: BoardData; user: AppUser; pending: boolean; error: string | null
  run: RunBoardCommand; onClose: () => void; register: RegisterDraftGuard
}
export function BoardCardDialog({ card, board, user, pending, deleted, error, run, onClose, register }: Props) {
  const titleId = useId()
  const editor = useBoardCardDraft(card, user, run)
  const { draft, setDraft } = editor
  const descriptionRef = useGrowingDescription(draft.description)
  const close = useDraftGuard(editor.dirty, pending, onClose, register)
  const exists = !deleted && board.cards.some((item) => item.id === card.id)
  return <BoardDialog title="Card details" onClose={close} className="kanban-card-dialog"
    headerActions={<button className="kanban-danger kanban-dialog-delete" disabled={pending || !exists}
      type="button" aria-label="Delete card" title="Delete card" onClick={async () => {
        if (!window.confirm(`Delete “${card.title}” and all its comments?${editor.dirty ? ' Unsaved changes will also be discarded.' : ''}`)) return
        if (await run({ type: 'delete-card', id: card.id })) onClose()
      }}><Trash2 size={17} aria-hidden="true" /></button>}>
    {pending && <p role="status">Saving changes…</p>}
    {error && <p role="alert" className="kanban-error">{error}</p>}
    {deleted && <p role="alert">This canvas was deleted elsewhere. Copy your draft before closing.</p>}
    {!deleted && !exists && <p role="alert">This card was deleted elsewhere. Copy your draft before closing.</p>}
    {editor.message && <p role="status">{editor.message}</p>}
    <div className="kanban-card-layout">
    <div className="kanban-card-editor">
    <form onSubmit={async (event) => {
      event.preventDefault()
      if (!pending && exists && draft.title.trim() && await editor.save() && !editor.comment) onClose()
    }}>
      <fieldset disabled={pending}>
        <div className="kanban-title-field"><label htmlFor={titleId}>Title</label><textarea id={titleId} name="title" rows={2} required maxLength={500} readOnly={!exists} value={draft.title}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault(); event.currentTarget.form?.requestSubmit()
            }
          }} onChange={(event) => setDraft({ ...draft, title: event.target.value.replace(/\r?\n/g, ' ') })} /></div>
        <label className="kanban-description-field"><span><AlignLeft size={17} aria-hidden="true" /> Description</span><textarea ref={descriptionRef} name="description" rows={14} placeholder="Add a more detailed description…" maxLength={100000} readOnly={!exists} value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <div className="kanban-actions">
          <button type="submit" className="kanban-primary" disabled={!exists || !draft.title.trim()}>Save</button>
          <button type="button" onClick={close}>Cancel</button>
        </div>
      </fieldset>
    </form>
    </div>
    <BoardComments comments={orderedComments(board, card.id)} text={editor.comment}
      onText={editor.setComment} pending={pending} readOnly={!exists} onAdd={editor.addComment} />
    </div>
  </BoardDialog>
}
