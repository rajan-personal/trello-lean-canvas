import { fn } from 'storybook/test'
import { sectionTemplate } from '../data/sections'
import type { CanvasSectionData, SectionId } from '../data/types'
import type { CanvasDragHandlers } from './CanvasSection'

function template(id: SectionId): CanvasSectionData {
  const section = sectionTemplate.find((item) => item.id === id)
  if (!section) throw new Error(`Missing section template: ${id}`)
  return section
}

export const problemSection: CanvasSectionData = {
  ...template('problem'),
  cards: [
    'Decisions disappear across chat, docs, and meetings',
    'Weekly status updates take team leads 2–3 hours',
    'Remote teams cannot see blockers early enough',
  ],
}

export const costSection: CanvasSectionData = {
  ...template('cost'),
  cards: [
    'Fixed\nProduct team and infrastructure',
    'Variable\nAI summaries and support',
  ],
}

export const defaultDragHandlers: CanvasDragHandlers = {
  draggedCard: null,
  dropTarget: null,
  onDrop: fn(),
  onDragOver: fn(),
  onDragStart: fn(),
  onDragEnd: fn(),
}
