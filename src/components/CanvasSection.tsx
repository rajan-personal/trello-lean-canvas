import { useLayoutEffect, useRef } from 'react'
import { CanvasCardList } from './CanvasCardList'
import type { CanvasSectionProps } from './CanvasSection.types'

export type {
  CanvasDragHandlers,
  CanvasDraggedCard,
  CanvasDropTarget,
  CanvasSectionProps,
  EditingCard,
} from './CanvasSection.types'

/** One section in the Lean Canvas grid. */
export function CanvasSection(props: CanvasSectionProps) {
  const {
    section,
    bottom = false,
    addingSectionId,
    startAddingCard,
    dragHandlers,
  } = props
  const isAdding = addingSectionId === section.id
  const hasHint = section.cards.length === 0 && !isAdding
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const wasAdding = useRef(false)
  useLayoutEffect(() => {
    if (wasAdding.current && !isAdding && document.activeElement === document.body) {
      addButtonRef.current?.focus()
    }
    wasAdding.current = isAdding
  }, [isAdding])
  return (
    <section
      className={`canvas-cell flex min-h-0 min-w-0 flex-[1_0_auto] flex-col px-[9px] pt-[11px] pb-[9px] ${bottom ? 'bottom-cell min-h-[150px] w-full' : 'min-h-[200px]'}`}
      onDragOver={(event) =>
        dragHandlers.onDragOver(event, section.id, section.cards.length)
      }
      onDrop={(event) =>
        dragHandlers.onDrop(event, section.id, section.cards.length)
      }
    >
      <header className="cell-heading flex min-h-5 items-start justify-between gap-[5px]">
        <strong className="ps-px text-sm leading-[19px] font-bold text-[#172b4d]">
          {section.title}
        </strong>
      </header>
      {hasHint && (
        <p className="cell-hint mx-px mt-px mb-1.5 min-h-7 text-[11px] leading-3.5 text-[#626f86]">
          {section.hint}
        </p>
      )}
      <CanvasCardList {...props} />
      {!isAdding && (
        <button
          ref={addButtonRef}
          className="add-card-button mt-[7px] min-h-7 w-full rounded-md border-0 bg-transparent px-[7px] py-1 text-left text-xs leading-[18px] text-[#44546f] hover:bg-[#dcdfe4] hover:text-[#172b4d]"
          onClick={() => startAddingCard(section.id)}
        >
          ＋ Add a card
        </button>
      )}
    </section>
  )
}
