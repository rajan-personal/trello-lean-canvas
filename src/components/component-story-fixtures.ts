import { fn } from 'storybook/test'
import { sectionTemplate } from '../data/sections'
import type { LeanCanvas, SectionId } from '../data/types'
import type { CanvasSectionProps } from './CanvasSection.types'

const cards: Partial<Record<SectionId, string[]>> = {
  problem: ['Customer decisions are scattered across too many tools'],
  solution: ['A shared one-page workspace for the whole team'],
  value: ['Turn assumptions into aligned decisions'],
  metrics: ['Weekly active teams'],
  cost: ['Product development', 'Infrastructure'],
  revenue: ['Team subscriptions'],
}

export const storySections = sectionTemplate.map((section) => ({
  ...section,
  cards: cards[section.id] ?? [],
}))

export const storyCanvas: LeanCanvas = {
  id: 'story-canvas',
  name: 'Team alignment',
  title: 'Lean Canvas — Team alignment',
  favorite: false,
  notes: 'Interview five customers before Friday.',
  sections: storySections,
}

export const favoriteCanvas: LeanCanvas = {
  ...storyCanvas,
  id: 'favorite-canvas',
  name: 'Favorite canvas with a deliberately long name',
  title: 'Favorite canvas with a deliberately long name',
  favorite: true,
}

export const storyBoardSectionProps: Omit<
  CanvasSectionProps,
  'section' | 'bottom'
> = {
  addingSectionId: null,
  setAddingSectionId: fn(),
  cardDraft: '',
  setCardDraft: fn(),
  addCard: fn(),
  editCard: fn(),
  deleteCard: fn(),
  editingCard: null,
  setEditingCard: fn(),
  saveEditedCard: fn(),
  startAddingCard: fn(),
  dragHandlers: {
    draggedCard: null,
    dropTarget: null,
    onDragStart: fn(),
    onDragOver: fn(),
    onDragEnd: fn(),
    onDrop: fn(),
  },
}

export const storySectionProps: CanvasSectionProps = {
  section: storySections[0],
  bottom: false,
  ...storyBoardSectionProps,
}
