import type { ComponentProps } from 'react'
import { CanvasBoard } from './CanvasBoard'
import { useCanvasStoryEditing } from './useCanvasStoryEditing'

export function CanvasBoardHarness(args: ComponentProps<typeof CanvasBoard>) {
  const state = useCanvasStoryEditing(args.sections, args.sectionProps)
  return <CanvasBoard {...state} />
}
