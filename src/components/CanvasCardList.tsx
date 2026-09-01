import type { DragEvent } from 'react'
import type { CanvasSectionProps } from './CanvasSection.types'
import { CardComposer } from './CardComposer'
import { getCardDropIndex } from './card-drag-layout'
import { CanvasCardSlot } from './CanvasCardSlot'

export function CanvasCardList(props: CanvasSectionProps) {
  const {
    section,
    bottom = false,
    addingSectionId,
    setAddingSectionId,
    cardDraft,
    setCardDraft,
    addCard,
    dragHandlers,
  } = props
  const isAdding = addingSectionId === section.id
  const hasHint = section.cards.length === 0 && !isAdding
  const getDropIndex = (event: DragEvent<HTMLDivElement>) =>
    getCardDropIndex(event, section.cards.length)

  return (
    <div
      className={`canvas-cards relative min-h-0 flex-none ${hasHint ? '' : 'mt-[7px]'} ${bottom ? 'grid grid-cols-2 gap-[7px] [&>.card-composer]:col-span-full' : 'flex flex-col gap-1.5'}`}
      onDragOver={(event) => {
        event.preventDefault()
        event.stopPropagation()
        dragHandlers.onDragOver(event, section.id, getDropIndex(event))
      }}
      onDrop={(event) => {
        event.stopPropagation()
        dragHandlers.onDrop(event, section.id, getDropIndex(event))
      }}
    >
      {section.cards.map((card, index) => (
        <CanvasCardSlot
          key={`${section.id}-${index}`}
          card={card}
          index={index}
          sectionProps={props}
        />
      ))}
      {isAdding && (
        <CardComposer
          value={cardDraft}
          setValue={setCardDraft}
          onSave={() => addCard(section.id)}
          onCancel={() => setAddingSectionId(null)}
        />
      )}
    </div>
  )
}
