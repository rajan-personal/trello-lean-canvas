import { useState, type DragEvent } from 'react'
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
  onSignOut: () => void
  open: boolean
  collapsed: boolean
  onClose: () => void
}
export function Sidebar(p: Props) {
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
          className="sidebar-scrim fixed inset-x-0 top-12 bottom-0 z-50 block h-[calc(100dvh-48px)] w-full border-0 bg-[rgba(9,30,66,0.45)] p-0 min-[761px]:hidden"
          onClick={p.onClose}
          aria-label="Close sidebar"
        />
      )}
      <aside
        id="canvas-sidebar"
        className={`sidebar relative z-10 flex h-full w-[248px] basis-[248px] flex-col overflow-hidden bg-[#07558f] px-2.5 py-3.5 text-white shadow-[1px_0_0_rgba(255,255,255,0.14)] transition-[flex-basis,width,padding] duration-180 ease-out max-[760px]:fixed max-[760px]:top-12 max-[760px]:bottom-0 max-[760px]:left-0 max-[760px]:z-60 max-[760px]:h-auto max-[760px]:shadow-[8px_0_24px_rgba(9,30,66,0.35)] max-[760px]:transition-transform ${p.open ? 'max-[760px]:translate-x-0' : 'max-[760px]:translate-x-[-102%]'} ${p.collapsed ? 'min-[761px]:w-0 min-[761px]:basis-0 min-[761px]:px-0 min-[761px]:shadow-none' : ''}`}
      >
        <div className="sidebar-heading hidden min-h-[34px] justify-end max-[760px]:mb-1.5 max-[760px]:flex">
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
          aria-label="Lean canvases"
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
        <div className="sidebar-footer mt-auto border-t border-white/14 pt-2">
          <AccountButton user={p.user} onSignOut={p.onSignOut} />
        </div>
      </aside>
    </>
  )
}
