import type { ReactNode } from 'react'
import { CanvasSection, type CanvasSectionProps } from './CanvasSection'
import { useCanvasStoryEditing } from './useCanvasStoryEditing'

export function CanvasSectionHarness(args: CanvasSectionProps & {
  children?: (props: CanvasSectionProps) => ReactNode
}) {
  const { sections, sectionProps } = useCanvasStoryEditing([args.section], args)
  const props = { ...args, ...sectionProps, section: sections[0] }
  return args.children ? args.children(props) : <CanvasSection {...props} />
}
