import type { Dispatch, DragEvent, SetStateAction } from 'react'
import type { CanvasSectionData, SectionId } from '../data'
import { CanvasCard } from './CanvasCard'
import { CardComposer } from './CardComposer'
import { InlineCardEditor } from './InlineCardEditor'

export interface EditingCard {
  sectionId: SectionId
  index: number
  value: string
}

export interface CanvasDragHandlers {
  onDragStart: (event: DragEvent<HTMLDivElement>, sectionId: SectionId, index: number) => void
  onDragEnd: () => void
  onDrop: (event: DragEvent<HTMLElement>, targetSectionId: SectionId) => void
}

export interface CanvasSectionProps {
  section: CanvasSectionData
  bottom?: boolean
  addingSectionId: SectionId | null
  setAddingSectionId: Dispatch<SetStateAction<SectionId | null>>
  cardDraft: string
  setCardDraft: Dispatch<SetStateAction<string>>
  addCard: (sectionId: SectionId) => void
  editCard: (sectionId: SectionId, index: number, value: string) => void
  deleteCard: (sectionId: SectionId, index: number) => void
  editingCard: EditingCard | null
  setEditingCard: Dispatch<SetStateAction<EditingCard | null>>
  saveEditedCard: () => void
  startAddingCard: (sectionId: SectionId) => void
  dragHandlers: CanvasDragHandlers
}

/** One section in the Lean Canvas grid. */
export function CanvasSection({
  section,
  bottom = false,
  addingSectionId,
  setAddingSectionId,
  cardDraft,
  setCardDraft,
  addCard,
  editCard,
  deleteCard,
  editingCard,
  setEditingCard,
  saveEditedCard,
  startAddingCard,
  dragHandlers,
}: CanvasSectionProps) {
  return (
    <section
      className={`canvas-cell${bottom ? ' bottom-cell' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => dragHandlers.onDrop(event, section.id)}
    >
      <header className="cell-heading">
        <strong>{section.title}</strong>
      </header>
      {section.cards.length === 0 && addingSectionId !== section.id && <p className="cell-hint">{section.hint}</p>}
      <div className="canvas-cards">
        {section.cards.map((card, index) => {
          const isEditing = editingCard?.sectionId === section.id && editingCard.index === index
          return isEditing ? (
            <InlineCardEditor
              key={`${section.id}-${index}`}
              value={editingCard.value}
              setValue={(value) => setEditingCard((current) => current ? { ...current, value } : current)}
              onSave={saveEditedCard}
              onCancel={() => setEditingCard(null)}
            />
          ) : (
            <CanvasCard
              key={`${section.id}-${index}`}
              text={card}
              sectionId={section.id}
              index={index}
              onEdit={editCard}
              onDelete={deleteCard}
              onDragStart={dragHandlers.onDragStart}
              onDragEnd={dragHandlers.onDragEnd}
            />
          )
        })}
        {addingSectionId === section.id && (
          <CardComposer
            value={cardDraft}
            setValue={setCardDraft}
            onSave={() => addCard(section.id)}
            onCancel={() => setAddingSectionId(null)}
          />
        )}
      </div>
      {addingSectionId !== section.id && (
        <button className="add-card-button" onClick={() => startAddingCard(section.id)}>＋ Add a card</button>
      )}
    </section>
  )
}
