import { useState } from 'react'
import type { SectionId } from '../data/types'
import {
  CanvasSection,
  type CanvasSectionProps,
  type EditingCard,
} from './CanvasSection'

export function CanvasSectionHarness(args: CanvasSectionProps) {
  const [section, setSection] = useState(args.section)
  const [adding, setAdding] = useState<SectionId | null>(args.addingSectionId)
  const [draft, setDraft] = useState(args.cardDraft)
  const [editing, setEditing] = useState<EditingCard | null>(args.editingCard)

  return (
    <CanvasSection
      {...args}
      section={section}
      addingSectionId={adding}
      setAddingSectionId={setAdding}
      cardDraft={draft}
      setCardDraft={setDraft}
      editingCard={editing}
      setEditingCard={setEditing}
      startAddingCard={(id) => {
        args.startAddingCard(id)
        setEditing(null)
        setAdding(id)
      }}
      addCard={(id) => {
        args.addCard(id)
        const text = draft.trim()
        if (!text) return
        setSection((current) => ({
          ...current,
          cards: [...current.cards, text],
        }))
        setDraft('')
        setAdding(null)
      }}
      editCard={(id, index, value) => {
        args.editCard(id, index, value)
        setAdding(null)
        setEditing({ sectionId: id, index, value })
      }}
      deleteCard={(id, index) => {
        args.deleteCard(id, index)
        setSection((current) => ({
          ...current,
          cards: current.cards.filter((_, cardIndex) => cardIndex !== index),
        }))
      }}
      saveEditedCard={() => {
        args.saveEditedCard()
        const value = editing?.value.trim()
        if (!editing || !value) return
        setSection((current) => ({
          ...current,
          cards: current.cards.map((card, index) =>
            index === editing.index ? value : card,
          ),
        }))
        setEditing(null)
      }}
    />
  )
}
