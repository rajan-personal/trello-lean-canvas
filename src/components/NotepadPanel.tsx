import { lazy, Suspense, useId, useRef, useState, type PointerEvent } from 'react'
import type { LeanCanvas } from '../data/types'
import { NotepadHeader } from './NotepadHeader'

const ProjectRichTextEditor = lazy(() => import('./ProjectRichTextEditor'))

interface Props {
  canvas: LeanCanvas
  open: boolean
  saving: boolean
  saveFailed: boolean
  onClose: () => void
  onChange: (notes: string) => void
}

const MIN_WIDTH = 260
const MAX_WIDTH = 640
const INITIAL_WIDTH = 320
const RESIZE_STEP = 20

function clampWidth(width: number): number {
  return Math.min(Math.min(MAX_WIDTH, window.innerWidth), Math.max(MIN_WIDTH, width))
}

export function NotepadPanel({ canvas, open, saving, saveFailed, onClose, onChange }: Props) {
  const id = useId()
  const resizeStart = useRef<{ x: number; width: number } | null>(null)
  const [width, setWidth] = useState(INITIAL_WIDTH)
  const [resizing, setResizing] = useState(false)

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
      className={`notepad-panel relative flex flex-col z-30 h-full min-w-0 max-w-full flex-none overflow-hidden bg-[#f1f2f4] shadow-[-2px_0_8px_rgba(9,30,66,0.18)] max-[761px]:fixed max-[761px]:inset-x-0 max-[761px]:top-12 max-[761px]:bottom-0 max-[761px]:h-auto max-[761px]:max-w-none max-[761px]:shadow-none ${open ? 'max-[761px]:!w-full' : ''}`}
      style={{ width: open ? width : 0 }}
      data-open={open}
      data-resizing={resizing}
      aria-label="Notepad"
      aria-hidden={!open}
      inert={!open}
    >
      <div
        className="group absolute inset-y-0 start-0 z-10 w-2 -translate-x-1/2 cursor-col-resize touch-pan-y focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0c66e4] max-[761px]:hidden"
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
        <span className="absolute inset-y-0 start-1/2 w-px bg-[#c1c7d0] group-hover:bg-[#0c66e4] group-focus-visible:bg-[#0c66e4]" />
        <span className="absolute top-1/2 start-1/2 h-8 w-1 -translate-1/2 rounded-full bg-[#8590a2]" />
      </div>
      <NotepadHeader id={id} saving={saving} saveFailed={saveFailed} onClose={onClose} />
      <Suspense fallback={<p className="p-3">Loading editor…</p>}>
        <ProjectRichTextEditor id={id} value={canvas.notes} focus={open}
          disabled={false} invalid={false} onChange={onChange} />
      </Suspense>
    </aside>
  )
}
