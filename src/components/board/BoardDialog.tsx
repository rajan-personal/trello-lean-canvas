import { X } from 'lucide-react'
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react'

interface Props { title: string; onClose: () => void; children: ReactNode; className?: string; headerActions?: ReactNode; lightDismiss?: boolean }
/** Native modal focus containment; every dismissal goes through the caller’s draft guard. */
export function BoardDialog({ title, onClose, children, className = '', headerActions, lightDismiss = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const requestClose = useEffectEvent(onClose)
  useEffect(() => {
    const element = ref.current!
    const previous = document.activeElement
    element.showModal()
    element.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not(:disabled), textarea:not(:disabled)')?.focus()
    return () => {
      element.close()
      if (previous instanceof HTMLElement && previous !== document.body && previous.isConnected) previous.focus()
      else document.getElementById('board-tab')?.focus()
    }
  }, [])
  useEffect(() => {
    if (!lightDismiss || 'closedBy' in HTMLDialogElement.prototype) return
    const element = ref.current!
    let startedOnBackdrop = false
    const pointerDown = (event: PointerEvent) => {
      startedOnBackdrop = event.button === 0 && isBackdrop(element, event)
    }
    const reset = () => { startedOnBackdrop = false }
    const click = (event: MouseEvent) => {
      const dismiss = startedOnBackdrop && event.detail > 0 && isBackdrop(element, event)
      reset()
      // Safari fallback: both ends must be outside, not padding or a drag from an editor.
      if (dismiss) requestClose()
    }
    element.addEventListener('pointerdown', pointerDown)
    element.addEventListener('pointercancel', reset)
    element.addEventListener('click', click)
    return () => {
      element.removeEventListener('pointerdown', pointerDown)
      element.removeEventListener('pointercancel', reset)
      element.removeEventListener('click', click)
    }
  }, [lightDismiss])
  return <dialog ref={ref} className={`kanban-dialog ${className}`} aria-labelledby={titleId}
    closedby={lightDismiss ? 'any' : 'closerequest'}
    onCancel={(event) => { event.preventDefault(); onClose() }}>
    <header><h2 id={titleId}>{title}</h2>
      <div className="kanban-dialog-header-actions">{headerActions}
        <button className="kanban-dialog-close" type="button" onClick={onClose} aria-label="Close dialog"><X size={20} aria-hidden="true" /></button>
      </div></header>
    {children}
  </dialog>
}

function isBackdrop(element: HTMLDialogElement, event: MouseEvent) {
  if (event.target !== element) return false
  const { left, right, top, bottom } = element.getBoundingClientRect()
  return event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom
}
