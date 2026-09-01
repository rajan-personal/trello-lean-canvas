import { MoreHorizontal } from 'lucide-react'
import { CanvasCard } from './CanvasCard.jsx'
import { CardComposer } from './CardComposer.jsx'
import { InlineCardEditor } from './InlineCardEditor.jsx'

/** One numbered or supporting section in the Lean Canvas grid. */
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
  clearSection,
  dragHandlers,
}) {
  return (
    <section
      className={`canvas-cell${bottom ? ' bottom-cell' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => dragHandlers.onDrop(event, section.id)}
    >
      <header className="cell-heading">
        <strong>{section.number && <span>{section.number}. </span>}{section.title}</strong>
        {(section.number || bottom) && (
          <button onClick={() => clearSection(section.id)} aria-label={`Clear ${section.title}`} title="Clear section">
            <MoreHorizontal size={20} />
          </button>
        )}
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
            onCancel={() => {
              setAddingSectionId(null)
              setCardDraft('')
            }}
          />
        )}
      </div>
      {addingSectionId !== section.id && (
        <button className="add-card-button" onClick={() => startAddingCard(section.id)}>＋ Add a card</button>
      )}
    </section>
  )
}
