import { useState } from 'react'
import type { RegisterDraftGuard } from '../../app/useNavigationGuard'
import { BoardDialog } from './BoardDialog'
import { useDraftGuard } from './useDraftGuard'

interface Props {
  deleted?: boolean; missing?: boolean; heading: string; initial?: string; pending: boolean; error: string | null; register: RegisterDraftGuard
  onSave: (title: string) => Promise<boolean>; onClose: () => void
}
export function BoardTitleDialog({ heading, initial = '', pending, deleted, missing, error, register, onSave, onClose }: Props) {
  const [title, setTitle] = useState(initial)
  const close = useDraftGuard(title !== initial, pending, onClose, register)
  return <BoardDialog title={heading} onClose={close}>
    {deleted && <p role="alert">This canvas was deleted elsewhere. Copy your draft before closing.</p>}
    {!deleted && missing && <p role="alert">This column was deleted elsewhere. Copy your draft before closing.</p>}
    {pending && <p role="status">Saving changes…</p>}
    {error && <p role="alert" className="kanban-error">{error}</p>}
    <form onSubmit={async (event) => {
      event.preventDefault()
      if (!pending && !deleted && !missing && title.trim() && await onSave(title.trim())) onClose()
    }}>
      <fieldset disabled={pending}>
        <label>Title<input required maxLength={500} readOnly={deleted || missing} value={title}
          onChange={(event) => setTitle(event.target.value)} /></label>
        <div className="kanban-actions">
          <button type="submit" className="kanban-primary" disabled={deleted || missing || !title.trim()}>Save</button>
          <button type="button" onClick={close}>Cancel</button>
        </div>
      </fieldset>
    </form>
  </BoardDialog>
}
