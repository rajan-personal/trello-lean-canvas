import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { LeanCanvas } from '../data/types'

interface Props {
  canvas: LeanCanvas
  open: boolean
  onChange: (notes: string) => void
}

const MIN_WIDTH = 260
const MAX_WIDTH = 640
const INITIAL_WIDTH = 320
const RESIZE_STEP = 20

function clampWidth(width: number): number {
  return Math.min(Math.min(MAX_WIDTH, window.innerWidth), Math.max(MIN_WIDTH, width))
}

export function NotepadPanel({ canvas, open, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resizeStart = useRef<{ x: number; width: number } | null>(null)
  const [width, setWidth] = useState(INITIAL_WIDTH)
  const [resizing, setResizing] = useState(false)

  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  const startResize = (event: PointerEvent<HTMLDivElement>) => {
    resizeStart.current = { x: event.clientX, width }
    setResizing(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const resize = (event: PointerEvent<HTMLDivElement>) => {
    if (!resizeStart.current) return
    setWidth(clampWidth(resizeStart.current.width + resizeStart.current.x - event.clientX))
  }
  const stopResize = (event: PointerEvent<HTMLDivElement>) => {
    resizeStart.current = null
    setResizing(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <aside
      id="canvas-notepad"
      className="notepad-panel relative z-30 h-full min-w-0 max-w-full flex-none overflow-hidden bg-[#0c66e4] shadow-[-2px_0_8px_rgba(9,30,66,0.18)] max-[900px]:fixed max-[900px]:top-12 max-[900px]:right-0 max-[900px]:bottom-0 max-[900px]:h-auto"
      style={{ width: open ? width : 0 }}
      data-open={open}
      data-resizing={resizing}
      aria-label="Notepad"
      aria-hidden={!open}
      inert={!open}
    >
      <div
        className="group absolute inset-y-0 start-0 z-10 w-2 -translate-x-1/2 cursor-col-resize touch-pan-y focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0c66e4]"
        role="separator"
        aria-label="Resize notepad"
        aria-orientation="vertical"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={startResize}
        onPointerMove={resize}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') setWidth((value) => clampWidth(value + RESIZE_STEP))
          if (event.key === 'ArrowRight') setWidth((value) => clampWidth(value - RESIZE_STEP))
          if (event.key === 'Home') setWidth(MIN_WIDTH)
          if (event.key === 'End') setWidth(clampWidth(MAX_WIDTH))
        }}
      >
        <span className="absolute inset-y-0 start-1/2 w-0.5 bg-[#0c66e4] group-hover:bg-[#85b8ff] group-focus-visible:bg-[#85b8ff]" />
      </div>
      <textarea
        ref={textareaRef}
        className="absolute inset-2 h-auto w-auto resize-none rounded-lg border-2 border-[#0c66e4] bg-[#e4e7ec] p-3 text-sm leading-6 text-[#172b4d] shadow-[inset_0_1px_2px_rgba(9,30,66,0.08),0_0_1px_rgba(9,30,66,0.24)] outline-none placeholder:text-[#626f86] focus-visible:border-[#0055cc]"
        value={canvas.notes}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write notes…"
        aria-label="Canvas notes"
        spellCheck="true"
      />
    </aside>
  )
}
