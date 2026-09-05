import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { BoardColumn } from '../../data/board'
import type { RunBoardCommand } from './board-ui'
import { columnMenuKeydown } from './column-menu-navigation'

interface Props {
  column: BoardColumn; index: number; count: number; empty: boolean; pending: boolean
  rename: () => void; run: RunBoardCommand
}
export function BoardColumnMenu({ column, index, count, empty, pending, rename, run }: Props) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  const nativePopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype
  const close = () => { setOpen(false); trigger.current?.focus() }

  useEffect(() => {
    if (!open) return
    const element = panel.current!
    const button = trigger.current!
    // Fixed coordinates work without CSS anchor positioning. The portal also escapes
    // list overflow in browsers without the Popover API's top layer.
    const position = () => {
      const rect = button.getBoundingClientRect()
      const width = element.offsetWidth
      const height = element.offsetHeight
      const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))
      const top = rect.bottom + 6 + height <= window.innerHeight - 8
        ? rect.bottom + 6 : Math.max(8, rect.top - height - 6)
      element.style.left = `${left}px`
      element.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`
    }
    if (nativePopover) element.showPopover()
    position()
    element.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
    const dismiss = (event: PointerEvent) => {
      if (!element.contains(event.target as Node) && !button.contains(event.target as Node)) {
        setOpen(false)
        // Do not steal focus from a control the user is clicking outside the panel.
        if (element.contains(document.activeElement)) button.focus()
      }
    }
    const keydown = (event: KeyboardEvent) => columnMenuKeydown(event, element, button, () => setOpen(false))
    let frame = 0
    const schedulePosition = () => {
      if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; position() })
    }
    window.addEventListener('resize', schedulePosition)
    window.addEventListener('scroll', schedulePosition, true)
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', keydown)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedulePosition)
      window.removeEventListener('scroll', schedulePosition, true)
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', keydown)
    }
  }, [open, nativePopover])

  return <div className="kanban-column-menu">
    <button ref={trigger} type="button" className="kanban-column-menu-trigger"
      aria-label={`Column actions for ${column.title}`} aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => setOpen(!open)}><MoreHorizontal size={18} aria-hidden="true" /></button>
    {open && createPortal(<div ref={panel} id={id} className="kanban-column-popover"
      popover={nativePopover ? 'auto' : undefined} role="group" aria-label={`Column actions for ${column.title}`}
      onToggle={(event) => {
        if (event.newState === 'closed') {
          setOpen(false)
          if (panel.current?.contains(document.activeElement) || document.activeElement === document.body)
            trigger.current?.focus()
        }
      }}>
      <p className="kanban-menu-heading">Column actions</p>
      <button type="button" disabled={pending} onClick={() => { close(); rename() }}>
        <Pencil size={16} aria-hidden="true" />Rename column</button>
      <button type="button" disabled={pending || index === 0}
        onClick={() => { close(); void run({ type: 'move-column', id: column.id, index: index - 1 }) }}>
        <ArrowLeft size={16} aria-hidden="true" />Move column left</button>
      <button type="button" disabled={pending || index === count - 1}
        onClick={() => { close(); void run({ type: 'move-column', id: column.id, index: index + 1 }) }}>
        <ArrowRight size={16} aria-hidden="true" />Move column right</button>
      <div className="kanban-menu-divider" />
      <button type="button" className="kanban-menu-delete" disabled={pending || !empty}
        title={empty ? undefined : 'Only empty columns can be deleted'} onClick={async () => {
          close()
          if (window.confirm(`Delete empty column “${column.title}”?`)) {
            await run({ type: 'delete-column', id: column.id })
            if (!trigger.current?.isConnected) document.getElementById('board-tab')?.focus()
          }
        }}><Trash2 size={16} aria-hidden="true" />Delete column</button>
      {!empty && <small>Only empty columns can be deleted.</small>}
    </div>, document.body)}
  </div>
}
