import { useRef, useState } from 'react'
import type {
  CanvasDragHandlers,
  CanvasDraggedCard,
  CanvasDropTarget,
} from '../components/CanvasSection'
import { moveCardInCanvas } from '../data/mutations'
import type { CanvasState } from './useCanvasState'

export function useCardDrag(
  state: CanvasState,
  cancelEdit: () => void,
  notify: (message: string) => void,
): CanvasDragHandlers {
  const draggedRef = useRef<CanvasDraggedCard | null>(null)
  const [draggedCard, setDraggedCard] = useState<CanvasDraggedCard | null>(null)
  const [dropTarget, setDropTarget] = useState<CanvasDropTarget | null>(null)
  return {
    draggedCard,
    dropTarget,
    onDragStart(event, sectionId, index) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', `${sectionId}:${index}`)
      const next = {
        sectionId,
        index,
        height: event.currentTarget.getBoundingClientRect().height,
      }
      draggedRef.current = next
      setDraggedCard(next)
      setDropTarget(null)
    },
    onDragOver(event, sectionId, index) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (!draggedRef.current) return
      setDropTarget((current) =>
        current?.sectionId === sectionId && current.index === index
          ? current
          : { sectionId, index },
      )
    },
    onDragEnd() {
      draggedRef.current = null
      setDraggedCard(null)
      setDropTarget(null)
    },
    onDrop(event, sectionId, index) {
      event.preventDefault()
      const dragged = draggedRef.current
      const target = { sectionId, index }
      draggedRef.current = null
      setDraggedCard(null)
      setDropTarget(null)
      if (!dragged || !state.activeCanvas) return
      if (
        moveCardInCanvas(state.activeCanvas, dragged, target) ===
        state.activeCanvas
      )
        return
      state.updateActiveCanvas((canvas) =>
        moveCardInCanvas(canvas, dragged, target),
      )
      cancelEdit()
      notify('Card moved')
    },
  }
}
