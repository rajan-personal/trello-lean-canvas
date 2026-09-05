import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props { title: string; onClose: () => void; children: ReactNode; className?: string; headerActions?: ReactNode }
/** Native modal focus containment. Deliberately no light-dismiss: drafts require an explicit exit. */
export function BoardDialog({ title, onClose, children, className = '', headerActions }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const element = ref.current!
    const previous = document.activeElement
    element.showModal()
    element.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not(:disabled), textarea:not(:disabled)')?.focus()
    return () => {
      element.close()
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
      else document.getElementById('board-tab')?.focus()
    }
  }, [])
  return <dialog ref={ref} className={`kanban-dialog ${className}`} aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); onClose() }}>
    <header><h2 id={titleId}>{title}</h2>
      <div className="kanban-dialog-header-actions">{headerActions}
        <button className="kanban-dialog-close" type="button" onClick={onClose} aria-label="Close dialog"><X size={20} aria-hidden="true" /></button>
      </div></header>
    {children}
  </dialog>
}
