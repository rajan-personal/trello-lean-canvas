import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { CanvasSectionData } from '../data/types'
import type { CanvasDragHandlers } from './CanvasSection.types'
import { moveCardInCanvas } from '../data/mutations'
import { storyCanvas } from './component-story-fixtures'

export function useCanvasStoryDrag(args: CanvasDragHandlers,
  setSections: Dispatch<SetStateAction<CanvasSectionData[]>>, cancelEdit: () => void,
): CanvasDragHandlers {
  const [draggedCard, setDragged] = useState(args.draggedCard)
  const [dropTarget, setTarget] = useState(args.dropTarget)
  const dragged = useRef(args.draggedCard)
  const reset = () => { dragged.current = null; setDragged(null); setTarget(null) }
  return {
    draggedCard, dropTarget,
    onDragStart(event, sectionId, index) {
      args.onDragStart(event, sectionId, index)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', `${sectionId}:${index}`)
      dragged.current = { sectionId, index, height: event.currentTarget.getBoundingClientRect().height }
      setDragged(dragged.current)
    },
    onDragOver(event, sectionId, index) {
      args.onDragOver(event, sectionId, index)
      event.preventDefault()
      if (dragged.current) setTarget({ sectionId, index })
    },
    onDragEnd() { args.onDragEnd(); reset() },
    onDrop(event, sectionId, index) {
      args.onDrop(event, sectionId, index)
      event.preventDefault()
      const source = dragged.current
      reset()
      if (!source) return
      setSections((sections) => moveCardInCanvas({ ...storyCanvas, sections }, source, { sectionId, index }).sections)
      cancelEdit()
    },
  }
}
