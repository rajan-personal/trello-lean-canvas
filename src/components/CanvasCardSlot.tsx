import { useLayoutEffect, useRef } from 'react'
import { CanvasCard } from './CanvasCard'
import { InlineCardEditor } from './InlineCardEditor'
import type { CanvasSectionProps } from './CanvasSection.types'
import { getCardShift } from './card-drag-layout'

interface Props {
  card: string
  index: number
  sectionProps: CanvasSectionProps
}

export function CanvasCardSlot({ card, index, sectionProps }: Props) {
  const {
    section,
    bottom = false,
    editCard,
    deleteCard,
    editingCard,
    setEditingCard,
    saveEditedCard,
    dragHandlers,
  } = sectionProps
  const isEditing =
    editingCard?.sectionId === section.id && editingCard.index === index

  const slotRef = useRef<HTMLDivElement>(null)
  const wasEditing = useRef(false)
  useLayoutEffect(() => {
    if (wasEditing.current && !isEditing && document.activeElement === document.body) {
      slotRef.current?.querySelector<HTMLButtonElement>('.card-content')?.focus()
    }
    wasEditing.current = isEditing
  }, [isEditing])

  if (isEditing) {
    return (
      <InlineCardEditor
        value={editingCard.value}
        setValue={(value) =>
          setEditingCard((current) =>
            current ? { ...current, value } : current,
          )
        }
        onSave={saveEditedCard}
        onCancel={() => setEditingCard(null)}
      />
    )
  }

  const isDragged =
    dragHandlers.draggedCard?.sectionId === section.id &&
    dragHandlers.draggedCard.index === index
  const shift = bottom
    ? 0
    : getCardShift(
        section.id,
        index,
        dragHandlers.draggedCard,
        dragHandlers.dropTarget,
        6,
      )

  return (
    <div
      ref={slotRef}
      className={`canvas-card-drop-slot relative min-w-0 transition-[transform,opacity] duration-180 ease-out motion-reduce:transition-none ${isDragged ? 'opacity-80' : 'opacity-100'}`}
      style={
        shift === 0 ? undefined : { transform: `translate3d(0, ${shift}px, 0)` }
      }
    >
      <CanvasCard
        text={card}
        sectionId={section.id}
        index={index}
        onEdit={editCard}
        onDelete={deleteCard}
        onDragStart={dragHandlers.onDragStart}
        onDragEnd={dragHandlers.onDragEnd}
      />
    </div>
  )
}
