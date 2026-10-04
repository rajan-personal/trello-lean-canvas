import { useId, useRef, useState } from 'react'
import { Ellipsis } from 'lucide-react'
import type { LeanCanvas } from '../data/types'
import { toolbarButtonClass } from './workspace-classes'

interface Props {
  canvas: LeanCanvas
  notepadOpen: boolean
  onFavorite: () => void
  onToggleNotepad: () => void
  onDownload: () => void
  onDelete: () => void
}

const itemClass = 'flex min-h-9 w-full items-center rounded-md border-0 bg-transparent px-3 text-left text-sm font-medium text-[#172b4d] hover:bg-[#f1f2f4] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4]'

export function CanvasMoreMenu(props: Props) {
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const positionMenu = () => {
    if (!triggerRef.current || !menuRef.current) return
    const { bottom, right } = triggerRef.current.getBoundingClientRect()
    menuRef.current.style.left = `${Math.max(8, Math.min(right - 192, innerWidth - 200))}px`
    menuRef.current.style.top = `${bottom + 6}px`
  }
  const run = (action: () => void) => {
    action()
    menuRef.current?.hidePopover()
  }

  return <div className="above-phone:hidden">
    <button ref={triggerRef} type="button" className={toolbarButtonClass}
      aria-label="More actions" title="More actions" aria-expanded={open} aria-controls={menuId}
      popoverTarget={menuId} onClick={positionMenu}>
      <Ellipsis size={19} aria-hidden="true" />
    </button>
    <div ref={menuRef} id={menuId} popover="auto" role="group" aria-label="Canvas actions"
      className="fixed inset-auto m-0 w-48 rounded-lg border border-[#dcdfe4] bg-white p-1.5 shadow-[0_8px_24px_rgba(9,30,66,0.22)]"
      onToggle={() => setOpen(menuRef.current?.matches(':popover-open') ?? false)}>
      <button type="button" className={itemClass} aria-label="Favorite canvas" aria-pressed={props.canvas.favorite}
        onClick={() => run(props.onFavorite)}>{props.canvas.favorite ? 'Unfavorite' : 'Favorite'}</button>
      <button type="button" className={itemClass} aria-label="Notepad" aria-expanded={props.notepadOpen} aria-controls="canvas-notepad"
        onClick={() => run(props.onToggleNotepad)}>Notes</button>
      <button type="button" className={itemClass} aria-label="Download canvas data as YAML"
        onClick={() => run(props.onDownload)}>Download YAML</button>
      <div aria-hidden="true" className="my-1 border-t border-[#dcdfe4]" />
      <button type="button" className={`${itemClass} text-[#ae2e24]!`} aria-label="Delete canvas"
        onClick={() => run(props.onDelete)}>Delete canvas</button>
    </div>
  </div>
}
