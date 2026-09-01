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
  const isAdding = addingSectionId === section.id
  const hasHint = section.cards.length === 0 && !isAdding

  return (
    <section
      className={`canvas-cell flex min-h-0 min-w-0 flex-[1_0_auto] flex-col px-[9px] pt-[11px] pb-[9px] ${bottom ? 'bottom-cell min-h-[150px] w-full' : 'min-h-[200px]'}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => dragHandlers.onDrop(event, section.id)}
    >
      <header className="cell-heading flex min-h-5 items-start justify-between gap-[5px]">
        <strong className="ps-px text-sm leading-[19px] font-bold text-[#172b4d]">{section.title}</strong>
      </header>
      {hasHint && <p className="cell-hint mx-px mt-px mb-1.5 min-h-7 text-[11px] leading-3.5 text-[#626f86]">{section.hint}</p>}
      <div
        className={`canvas-cards min-h-0 flex-none ${hasHint ? '' : 'mt-[7px]'} ${bottom ? 'grid grid-cols-2 gap-[7px] [&>.card-composer]:col-span-full' : 'flex flex-col gap-1.5'}`}
      >
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
        {isAdding && (
          <CardComposer
            value={cardDraft}
            setValue={setCardDraft}
            onSave={() => addCard(section.id)}
            onCancel={() => setAddingSectionId(null)}
          />
        )}
      </div>
      {!isAdding && (
        <button
          className="add-card-button mt-[7px] min-h-7 w-full rounded-md border-0 bg-transparent px-[7px] py-1 text-left text-xs leading-[18px] text-[#44546f] hover:bg-[#dcdfe4] hover:text-[#172b4d]"
          onClick={() => startAddingCard(section.id)}
        >
          ＋ Add a card
        </button>
      )}
    </section>
  )
}
