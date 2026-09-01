import type { DragEvent } from 'react'
export type DropTarget = { canvasId: string; edge: 'before' | 'after' }
export function getCanvasDropEdge(
  event: DragEvent<HTMLElement>,
): 'before' | 'after' {
  const bounds = event.currentTarget.getBoundingClientRect()
  return event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
}
