import { useEffect, useRef, useState } from 'react'
import type { RegisterDraftGuard } from '../../app/useNavigationGuard'
import { useDraftGuard } from './useDraftGuard'

interface Props {
  kind: 'card' | 'column'; pending: boolean; deleted?: boolean; error: string | null
  register: RegisterDraftGuard; onSave: (id: string, title: string) => Promise<boolean>; onClose: () => void
}
export function BoardInlineComposer({ kind, pending, deleted, error, register, onSave, onClose }: Props) {
  const [id] = useState(() => crypto.randomUUID())
  const [title, setTitle] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)
  const busy = useRef(false)
  const close = useDraftGuard(title.length > 0, pending, onClose, register)
  useEffect(() => { input.current?.focus() }, [])
  return <form className="kanban-composer" aria-label={`Add ${kind}`} onSubmit={async (event) => {
    event.preventDefault()
    if (busy.current || pending || deleted || !title.trim()) return
    busy.current = true
    try { if (await onSave(id, title.trim())) onClose() } finally { busy.current = false }
  }} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.stopPropagation(); close() }
  }}>
    <label>{kind === 'card' ? 'Card title' : 'Column title'}
      <textarea ref={input} name="title" required maxLength={500} rows={2} value={title}
        disabled={pending} readOnly={deleted} onChange={(event) => setTitle(event.target.value)} />
    </label>
    {error && <p role="alert" className="kanban-error">{error}</p>}
    <div className="kanban-actions">
      <button type="submit" className="kanban-primary" disabled={pending || deleted || !title.trim()}>Add {kind}</button>
      <button type="button" disabled={pending} onClick={close}>Cancel</button>
    </div>
  </form>
}
