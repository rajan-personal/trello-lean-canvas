import { useState } from 'react'
import type { LeanCanvas } from '../data/types'

const PREFIX = 'Lean Canvas — '
function displayTitle(canvas: LeanCanvas): string {
  const title = canvas.title?.trim() || canvas.name
  return title.startsWith(PREFIX)
    ? title.slice(PREFIX.length).trim() || canvas.name
    : title
}
export function BoardTitle({
  canvas,
  onRename,
}: {
  canvas: LeanCanvas
  onRename: (name: string) => void
}) {
  const shown = displayTitle(canvas)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(shown)
  const commit = () => {
    const name = draft.trim()
    setEditing(false)
    if (!name) {
      setDraft(shown)
      return
    }
    if (name !== shown) onRename(name)
  }
  return (
    <h1
      className={`board-title m-0 flex min-w-0 max-w-[min(52vw,620px)] items-center text-lg leading-7 font-bold tracking-[-0.15px] whitespace-nowrap max-[760px]:text-base ${editing ? 'flex-[0_1_auto] overflow-visible' : 'overflow-hidden'}`}
    >
      {editing ? (
        <input
          className="board-title-input h-8 w-[clamp(100px,18vw,260px)] min-w-0 rounded-sm border-2 border-[#85b8ff] bg-white px-1.5 py-0.5 font-[inherit] leading-6 tracking-[inherit] text-[#172b4d] outline-none focus:border-[#579dff] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.85)] max-[760px]:w-[clamp(90px,30vw,170px)]"
          aria-label="Rename canvas"
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setDraft(shown)
              setEditing(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="board-title-button ms-[-6px] min-w-0 max-w-[min(52vw,620px)] overflow-hidden text-ellipsis whitespace-nowrap rounded-sm border-0 bg-transparent px-1.5 py-0.5 font-[inherit] leading-[inherit] tracking-[inherit] text-[inherit] hover:bg-white/17 focus-visible:bg-white/17 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
          title="Rename canvas"
          onClick={() => {
            setDraft(shown)
            setEditing(true)
          }}
        >
          {shown}
        </button>
      )}
    </h1>
  )
}
