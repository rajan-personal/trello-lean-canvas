import type { Dispatch, DragEvent, SetStateAction } from 'react'
import type { CanvasSectionData, SectionId } from '../data/types'

export interface EditingCard {
  sectionId: SectionId
  index: number
  value: string
}

export interface CanvasDropTarget {
  sectionId: SectionId
  index: number
}

export interface CanvasDraggedCard {
  sectionId: SectionId
  index: number
  height: number
}

export interface CanvasDragHandlers {
  draggedCard: CanvasDraggedCard | null
  dropTarget: CanvasDropTarget | null
  onDragStart: (
    event: DragEvent<HTMLDivElement>,
    sectionId: SectionId,
    index: number,
  ) => void
  onDragOver: (
    event: DragEvent<HTMLElement>,
    sectionId: SectionId,
    index: number,
  ) => void
  onDragEnd: () => void
  onDrop: (
    event: DragEvent<HTMLElement>,
    sectionId: SectionId,
    index: number,
  ) => void
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
