import type { DragEvent } from 'react'
import { X } from 'lucide-react'
import type { SectionId } from '../data'

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
      className="canvas-card"
      draggable
      onDragStart={(event) => onDragStart(event, sectionId, index)}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        className="card-content"
        onClick={(event) => {
          if (event.detail === 0) onEdit(sectionId, index, text)
        }}
        onDoubleClick={() => onEdit(sectionId, index, text)}
        onPointerUp={(event) => {
          if (event.pointerType !== 'mouse') onEdit(sectionId, index, text)
        }}
        title="Double-click to edit; drag to move"
      >
        {hasHeading && <strong>{heading}</strong>}
        <span className="card-text">{hasHeading ? body.join('\n') : heading}</span>
      </button>
      <button
        type="button"
        className="card-delete-button"
        onClick={() => onDelete(sectionId, index)}
        aria-label={`Delete “${heading}”`}
        title="Delete card"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
