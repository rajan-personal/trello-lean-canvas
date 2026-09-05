import { useCanvasStoryDrag } from './useCanvasStoryDrag'
import { useState } from 'react'
import type { CanvasSectionData } from '../data/types'
import type { CanvasSectionProps } from './CanvasSection.types'

type EditingProps = Omit<CanvasSectionProps, 'section' | 'bottom'>
/** Local, deterministic rendering of the controlled editing contract. */
export function useCanvasStoryEditing(initial: CanvasSectionData[], args: EditingProps) {
  const [sections, setSections] = useState(initial)
  const [addingSectionId, setAddingSectionId] = useState(args.addingSectionId)
  const [cardDraft, setCardDraft] = useState(args.cardDraft)
  const [editingCard, setEditingCard] = useState(args.editingCard)
  const dragHandlers = useCanvasStoryDrag(args.dragHandlers, setSections, () => setEditingCard(null))
  const update = (id: string, transform: (cards: string[]) => string[]) =>
    setSections((current) => current.map((section) => section.id === id
      ? { ...section, cards: transform(section.cards) } : section))
  const sectionProps: EditingProps = {
    ...args, addingSectionId, setAddingSectionId, cardDraft, setCardDraft,
    editingCard, setEditingCard, dragHandlers,
    startAddingCard(id) {
      args.startAddingCard(id)
      setEditingCard(null)
      setAddingSectionId(id)
    },
    addCard(id) {
      if (!cardDraft.trim()) return
      args.addCard(id)
      update(id, (cards) => [...cards, cardDraft.trim()])
      setCardDraft('')
      setAddingSectionId(null)
    },
    editCard(sectionId, index, value) {
      args.editCard(sectionId, index, value)
      setAddingSectionId(null)
      setEditingCard({ sectionId, index, value })
    },
    deleteCard(id, index) {
      args.deleteCard(id, index)
      update(id, (cards) => cards.filter((_, i) => i !== index))
      if (editingCard?.sectionId === id) setEditingCard(null)
    },
    saveEditedCard() {
      if (!editingCard?.value.trim()) return
      args.saveEditedCard()
      update(editingCard.sectionId, (cards) => cards.map((card, i) =>
        i === editingCard.index ? editingCard.value.trim() : card))
      setEditingCard(null)
    },
  }
  return { sections, sectionProps }
}
