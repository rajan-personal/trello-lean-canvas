import { useState, type DragEvent } from 'react'
import { useSidebarVisibility } from './useSidebarVisibility'
import { X } from 'lucide-react'
import type { AppUser } from '../auth/auth-context'
import type { LeanCanvas } from '../data/types'
import { AccountButton } from './AccountButton'
import { brandActionButtonClass } from './workspace-classes'
import { SidebarCanvasItem } from './SidebarCanvasItem'
import { getCanvasDropEdge, type DropTarget } from './sidebar-drag'
interface Props {
  canvases: LeanCanvas[]
  activeId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, index: number) => void
  user: AppUser
  onSignOut: () => void | Promise<void>
  onSetPassword?: (password: string) => Promise<void>
  open: boolean
  collapsed: boolean
  onClose: () => void
}
export function Sidebar(p: Props) {
  const { ref: sidebarRef, hidden, drawer } = useSidebarVisibility(p.open, p.collapsed)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [target, setTarget] = useState<DropTarget | null>(null)
  const drop = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault()
    const sourceId = draggedId || event.dataTransfer.getData('text/plain')
    const source = p.canvases.findIndex((canvas) => canvas.id === sourceId)
    const destination = p.canvases.findIndex((canvas) => canvas.id === targetId)
    if (source < 0 || destination < 0 || source === destination) return
    const insertion =
      destination + (getCanvasDropEdge(event) === 'after' ? 1 : 0)
    p.onMove(sourceId, insertion - (source < insertion ? 1 : 0))
    setDraggedId(null)
    setTarget(null)
  }
  return (
    <>
      {p.open && (
        <button
          className="sidebar-scrim fixed inset-x-0 top-12 bottom-0 z-50 block h-[calc(100dvh-48px)] w-full border-0 bg-[rgba(9,30,66,0.45)] p-0 docked:hidden"
          onClick={p.onClose}
          aria-label="Close sidebar"
        />
      )}
      <aside
        id="canvas-sidebar"
        ref={sidebarRef}
        inert={hidden}
        aria-hidden={hidden}
        onKeyDown={(event) => {
          if (drawer && event.key === 'Escape') { event.preventDefault(); p.onClose() }
        }}
        className={`sidebar relative z-10 flex h-full w-[248px] basis-[248px] flex-col overflow-hidden bg-chrome px-2.5 py-3.5 text-white border-e border-white/20 shadow-[2px_0_8px_rgba(9,30,66,0.28)] transition-[flex-basis,width,padding] duration-180 ease-out drawer:fixed drawer:top-12 drawer:bottom-0 drawer:left-0 drawer:z-60 drawer:h-auto drawer:shadow-[8px_0_24px_rgba(9,30,66,0.35)] drawer:transition-transform ${p.open ? 'drawer:translate-x-0' : 'drawer:translate-x-[-102%]'} ${p.collapsed ? 'docked:w-0 docked:basis-0 docked:px-0 docked:border-e-0 docked:shadow-none' : ''}`}
      >
        <div className="sidebar-heading hidden min-h-[34px] justify-end drawer:mb-1.5 drawer:flex">
          <button
            className={`${brandActionButtonClass} mobile-close`}
            onClick={p.onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
        <nav
          className="grid min-h-0 gap-[3px] overflow-y-auto"
          aria-label="Workspace navigation"
        >
          {p.canvases.map((canvas, index) => (
            <SidebarCanvasItem
              key={canvas.id}
              canvas={canvas}
              index={index}
              activeId={p.activeId}
              draggedId={draggedId}
              dropTarget={target}
              onMove={p.onMove}
              onSelect={(id) => {
                p.onSelect(id)
                p.onClose()
              }}
              onDrag={setDraggedId}
              onTarget={setTarget}
              onDrop={drop}
            />
          ))}
        </nav>
        <div className="sidebar-footer mt-auto shrink-0 border-t border-white/14 pt-2">
          <AccountButton user={p.user} onSignOut={p.onSignOut} onSetPassword={p.onSetPassword} />
        </div>
      </aside>
    </>
  )
}
