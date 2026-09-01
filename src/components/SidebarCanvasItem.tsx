import type { DragEvent } from 'react'
import { Star } from 'lucide-react'
import type { LeanCanvas } from '../data/types'

import { getCanvasDropEdge, type DropTarget } from './sidebar-drag'
interface Props {
  canvas: LeanCanvas
  index: number
  activeId: string | null
  draggedId: string | null
  dropTarget: DropTarget | null
  onSelect: (id: string) => void
  onMove: (id: string, index: number) => void
  onDrag: (id: string | null) => void
  onTarget: (target: DropTarget | null) => void
  onDrop: (event: DragEvent<HTMLElement>, id: string) => void
}
export function SidebarCanvasItem(p: Props) {
  const targeted =
    p.draggedId !== null && p.dropTarget?.canvasId === p.canvas.id
  const indicator = targeted
    ? p.dropTarget?.edge === 'before'
      ? 'before:absolute before:inset-x-1 before:top-[-2px] before:h-0.5 before:rounded-full before:bg-[#85b8ff]'
      : 'after:absolute after:inset-x-1 after:bottom-[-2px] after:h-0.5 after:rounded-full after:bg-[#85b8ff]'
    : ''
  return (
    <div
      className={`canvas-nav-row relative ${indicator}`}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        if (p.draggedId !== p.canvas.id)
          p.onTarget({ canvasId: p.canvas.id, edge: getCanvasDropEdge(event) })
      }}
      onDrop={(event) => p.onDrop(event, p.canvas.id)}
    >
      <button
        type="button"
        draggable
        aria-label={p.canvas.name}
        title="Drag to reorder. Press Alt+Up or Alt+Down to move."
        className={`canvas-nav-item flex min-h-[38px] w-full items-center gap-2 overflow-hidden rounded-md border-0 px-2.5 py-2 ps-3.5 text-left text-sm leading-5 font-medium whitespace-nowrap text-white/90 hover:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white ${p.canvas.id === p.activeId ? 'bg-white/16 text-white' : 'bg-transparent'} ${p.draggedId === p.canvas.id ? 'opacity-45' : ''}`}
        onClick={() => p.onSelect(p.canvas.id)}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', p.canvas.id)
          p.onDrag(p.canvas.id)
        }}
        onDragEnd={() => {
          p.onDrag(null)
          p.onTarget(null)
        }}
        onKeyDown={(event) => {
          if (
            !event.altKey ||
            (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
          )
            return
          event.preventDefault()
          p.onMove(p.canvas.id, p.index + (event.key === 'ArrowUp' ? -1 : 1))
        }}
      >
        <span className="canvas-nav-label min-w-0 flex-1 overflow-hidden text-ellipsis">
          {p.canvas.name}
        </span>
        {p.canvas.favorite && (
          <Star
            className="canvas-nav-favorite flex-none text-[#f5cd47]"
            size={15}
            fill="currentColor"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  )
}
