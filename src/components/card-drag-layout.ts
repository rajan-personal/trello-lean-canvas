import type { DragEvent } from 'react'
import type { SectionId } from '../data/types'
import type {
  CanvasDraggedCard,
  CanvasDropTarget,
} from './CanvasSection.types'

export function getCardDropIndex(
  event: DragEvent<HTMLDivElement>,
  count: number,
): number {
  const slots = event.currentTarget.querySelectorAll<HTMLElement>(
    ':scope > .canvas-card-drop-slot',
  )
  const bounds = event.currentTarget.getBoundingClientRect()
  const pointerY = event.clientY - bounds.top + event.currentTarget.scrollTop
  const index = [...slots].findIndex(
    (slot) => pointerY < slot.offsetTop + slot.offsetHeight / 2,
  )
  return index < 0 ? count : index
}

export function getCardShift(
  sectionId: SectionId,
  index: number,
  dragged: CanvasDraggedCard | null,
  target: CanvasDropTarget | null,
  gap: number,
): number {
  if (!dragged || !target) return 0
  const distance = dragged.height + gap
  if (dragged.sectionId === sectionId && target.sectionId === sectionId) {
    const finalIndex = target.index - (dragged.index < target.index ? 1 : 0)
    if (
      finalIndex > dragged.index &&
      index > dragged.index &&
      index <= finalIndex
    )
      return -distance
    if (
      finalIndex < dragged.index &&
      index >= finalIndex &&
      index < dragged.index
    )
      return distance
    return 0
  }
  if (dragged.sectionId === sectionId && index > dragged.index) return -distance
  if (target.sectionId === sectionId && index >= target.index) return distance
  return 0
}
