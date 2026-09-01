import type { LeanCanvas, SectionId } from './types'

interface CardPosition {
  sectionId: SectionId
  index: number
}

export function moveCardInCanvas(
  canvas: LeanCanvas,
  dragged: CardPosition,
  target: CardPosition,
): LeanCanvas {
  const source = canvas.sections.find(
    (section) => section.id === dragged.sectionId,
  )
  const destination = canvas.sections.find(
    (section) => section.id === target.sectionId,
  )
  const card = source?.cards[dragged.index]
  if (!source || !destination || card === undefined) return canvas
  let targetIndex = Math.max(
    0,
    Math.min(target.index, destination.cards.length),
  )
  if (source.id === destination.id) {
    const cards = [...source.cards]
    cards.splice(dragged.index, 1)
    if (dragged.index < targetIndex) targetIndex -= 1
    if (dragged.index === targetIndex) return canvas
    cards.splice(targetIndex, 0, card)
    return {
      ...canvas,
      sections: canvas.sections.map((section) =>
        section.id === source.id ? { ...section, cards } : section,
      ),
    }
  }
  const targetCards = [...destination.cards]
  targetCards.splice(targetIndex, 0, card)
  return {
    ...canvas,
    sections: canvas.sections.map((section) => {
      if (section.id === source.id)
        return {
          ...section,
          cards: section.cards.filter((_, index) => index !== dragged.index),
        }
      if (section.id === destination.id)
        return { ...section, cards: targetCards }
      return section
    }),
  }
}
