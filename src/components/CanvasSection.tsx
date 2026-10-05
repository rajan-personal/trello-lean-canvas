import { useLayoutEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
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
    sub = false,
    addingSectionId,
    startAddingCard,
    dragHandlers,
  } = props
  const isAdding = addingSectionId === section.id
  const hasHint = section.cards.length === 0 && !isAdding
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const canAddOnClick = useRef(false)
  const wasAdding = useRef(false)
  useLayoutEffect(() => {
    if (wasAdding.current && !isAdding && document.activeElement === document.body) {
      addButtonRef.current?.focus()
    }
    wasAdding.current = isAdding
  }, [isAdding])
  return (
    <section
      className={`canvas-cell ${hasHint ? 'group' : ''} flex min-h-0 min-w-0 flex-[1_0_auto] flex-col px-[9px] pt-[11px] pb-[9px] ${bottom ? 'bottom-cell min-h-[120px] w-full' : sub ? 'min-h-[112px]' : 'min-h-[160px]'} ${sub ? 'flex-none border-t-2 border-[#d6dce5]' : 'flex-1'}`}
      // The composer can dismiss on pointerdown; don't reopen it on the same click.
      onPointerDownCapture={() => { canAddOnClick.current = hasHint }}
      onClick={(event) => {
        if (hasHint && canAddOnClick.current && event.target instanceof Element &&
          !event.target.closest('button, input, textarea, select, a, [role="button"], [contenteditable], .canvas-card')) {
          startAddingCard(section.id)
        }
      }}
      onDragOver={(event) =>
        dragHandlers.onDragOver(event, section.id, section.cards.length)
      }
      onDrop={(event) =>
        dragHandlers.onDrop(event, section.id, section.cards.length)
      }
    >
      <header className="cell-heading flex min-h-5 items-start justify-between gap-[5px]">
        <strong className={`ps-px leading-[19px] ${sub ? 'text-[13px] font-semibold text-[#44546f]' : `${section.id === 'value' ? 'text-[15px]' : 'text-sm'} font-bold text-[#172b4d]`}`}>
          {section.title}
        </strong>
      </header>
      {hasHint && (
        <p className="cell-hint mx-px mt-px mb-1.5 text-[12px] leading-4 text-[#8590a2]">
          {section.hint}
        </p>
      )}
      <CanvasCardList {...props} />
      {!isAdding && (
        <button
          ref={addButtonRef}
          className={`add-card-button mt-[7px] min-h-7 rounded-md border-0 bg-transparent px-[7px] py-1 text-left flex items-center gap-1.5 leading-5 font-medium hover:bg-[#dcdfe4] hover:text-[#172b4d] ${hasHint ? 'w-fit text-[13px] text-[#626f86] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4]' : 'w-full text-sm text-[#44546f]'}`}
          onClick={() => startAddingCard(section.id)}
        >
          <Plus size={hasHint ? 14 : 16} aria-hidden="true" />Add a card
        </button>
      )}
    </section>
  )
}
