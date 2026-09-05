import type { DragEvent } from 'react'
import { X } from 'lucide-react'
import type { SectionId } from '../data/types'

export interface CanvasCardProps {
  text: string
  sectionId: SectionId
  index: number
  onEdit: (sectionId: SectionId, index: number, value: string) => void
  onDelete: (sectionId: SectionId, index: number) => void
  onDragStart: (event: DragEvent<HTMLDivElement>, sectionId: SectionId, index: number) => void
  onDragEnd: () => void
}

/** A draggable Lean Canvas hypothesis card with optional heading and body text. */
export function CanvasCard({ text, sectionId, index, onEdit, onDelete, onDragStart, onDragEnd }: CanvasCardProps) {
  const [heading, ...body] = text.split('\n')
  const hasHeading = body.length > 0

  return (
    <div
      className="canvas-card group relative min-h-8 w-full cursor-grab rounded-lg bg-white text-[13px] leading-[1.32] font-normal text-[#172b4d] shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)] hover:outline-2 hover:-outline-offset-2 hover:outline-[#0c66e4] active:cursor-grabbing has-[.card-content:focus-visible]:outline-2 has-[.card-content:focus-visible]:-outline-offset-2 has-[.card-content:focus-visible]:outline-[#0c66e4]"
      draggable
      onDragStart={(event) => onDragStart(event, sectionId, index)}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        className="card-content block [overflow-wrap:anywhere] min-h-8 w-full cursor-[inherit] rounded-[inherit] border-0 bg-transparent py-[7px] ps-2.5 pe-8 text-left font-[inherit] leading-[inherit] text-[inherit] focus-visible:outline-none"
        onClick={(event) => {
          if (event.detail === 0) onEdit(sectionId, index, text)
        }}
        onDoubleClick={() => onEdit(sectionId, index, text)}
        onPointerUp={(event) => {
          if (event.pointerType !== 'mouse') onEdit(sectionId, index, text)
        }}
        title="Double-click to edit; drag to move"
      >
        {hasHeading && <strong className="mb-px block font-bold whitespace-pre-line">{heading}</strong>}
        <span className="card-text block whitespace-pre-line">{hasHeading ? body.join('\n') : heading}</span>
      </button>
      <button
        type="button"
        className="card-delete-button pointer-events-none absolute top-1 end-1 grid size-6 place-items-center rounded-md border-0 bg-[#f1f2f4] p-0 text-[#44546f] opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-[#ffedeb] hover:text-[#ae2e24] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4] [@media(pointer:coarse)]:pointer-events-auto [@media(pointer:coarse)]:opacity-100"
        onClick={() => onDelete(sectionId, index)}
        aria-label={`Delete “${heading}”`}
        title="Delete card"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
