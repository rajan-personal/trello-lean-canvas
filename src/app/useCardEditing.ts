import { useState } from 'react'
import type { CanvasSectionData, SectionId } from '../data/types'
import type { EditingCard } from '../components/CanvasSection'
import type { CanvasState } from './useCanvasState'

export function useCardEditing(
  state: CanvasState,
  notify: (message: string) => void,
) {
  const [addingSectionId, setAddingSectionId] = useState<SectionId | null>(null)
  const [cardDraft, setCardDraft] = useState('')
  const [editingCard, setEditingCard] = useState<EditingCard | null>(null)
  const [ownerId, setOwnerId] = useState(state.activeCanvas?.id)
  if (ownerId !== state.activeCanvas?.id) {
    setOwnerId(state.activeCanvas?.id)
    setAddingSectionId(null)
    setCardDraft('')
    setEditingCard(null)
  }
  const updateSection = (
    id: SectionId,
    update: (section: CanvasSectionData) => CanvasSectionData,
  ) =>
    state.updateActiveCanvas((canvas) => ({
      ...canvas,
      sections: canvas.sections.map((section) =>
        section.id === id ? update(section) : section,
      ),
    }))
  const addCard = (id: SectionId) => {
    const text = cardDraft.trim()
    if (!text) return
    updateSection(id, (section) => ({
      ...section,
      cards: [...section.cards, text],
    }))
    setCardDraft('')
    setAddingSectionId(null)
    notify('Card added')
  }
  const editCard = (sectionId: SectionId, index: number, value: string) => {
    setAddingSectionId(null)
    setEditingCard({ sectionId, index, value })
  }
  const saveEditedCard = () => {
    const value = editingCard?.value.trim()
    if (!editingCard || !value) return
    updateSection(editingCard.sectionId, (section) => ({
      ...section,
      cards: section.cards.map((card, index) =>
        index === editingCard.index ? value : card,
      ),
    }))
    setEditingCard(null)
    notify('Card updated')
  }
  const deleteCard = (id: SectionId, index: number) => {
    updateSection(id, (section) => ({
      ...section,
      cards: section.cards.filter((_, i) => i !== index),
    }))
    if (editingCard?.sectionId === id) setEditingCard(null)
    notify('Card deleted')
  }
  const startAddingCard = (id: SectionId) => {
    setEditingCard(null)
    setAddingSectionId(id)
  }
  const clearCardEditing = () => {
    setAddingSectionId(null)
    setEditingCard(null)
  }
  return {
    addingSectionId,
    setAddingSectionId,
    cardDraft,
    setCardDraft,
    editingCard,
    setEditingCard,
    addCard,
    editCard,
    saveEditedCard,
    deleteCard,
    startAddingCard,
    clearCardEditing,
  }
}
