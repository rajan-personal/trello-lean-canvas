import type { DragEvent, KeyboardEvent, Ref } from 'react'
import { maxAboutTabTitle } from '../data/canvas-schema'
import type { AboutTab } from '../data/types'
import { AboutFileIcon, AboutFileName } from './about-file-icon'

interface Props {
  id: string
  tab: AboutTab
  selected: boolean
  pinned: boolean
  canDrag: boolean
  dragged: boolean
  indicator: '' | 'before' | 'after'
  renaming: boolean
  buttonRef: Ref<HTMLButtonElement>
  onClick: () => void
  onRename: (title: string) => void
  onRenameStart: () => void
  onRenameEnd: (cancel: boolean, refocus: boolean) => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
}
const row = 'flex h-[22px] w-full items-center gap-1.5 ps-5 pe-2 text-left text-[13px] max-[760px]:h-11 max-[760px]:ps-3'
const line = { before: 'before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[#0090f1]',
  after: 'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#0090f1]', '': '' }

export function ProjectAboutTabRow({ buttonRef, ...p }: Props) {
  return <div className={`relative ${line[p.indicator]}`} onDragOver={p.onDragOver} onDrop={p.onDrop}>
    {p.renaming ? <div className={`${row} bg-[#e4e6f1]`}>
      <AboutFileIcon pinned={false} />
      <input aria-label="Tab name" value={p.tab.title} maxLength={maxAboutTabTitle} autoFocus onFocus={(event) => event.target.select()}
        onChange={(event) => p.onRename(event.target.value)} onBlur={() => p.onRenameEnd(false, false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); p.onRenameEnd(false, true) }
          if (event.key === 'Escape') { event.preventDefault(); p.onRenameEnd(true, true) }
        }}
        className="h-[20px] min-w-0 flex-1 border border-[#0090f1] bg-white px-1 text-[13px] text-[#3b3b3b] outline-none max-[760px]:h-9" />
    </div>
      : <button type="button" role="tab" id={`${p.id}-${p.tab.id}-tab`} ref={buttonRef} draggable={p.canDrag}
        aria-selected={p.selected} aria-controls={`${p.id}-panel`} tabIndex={p.selected ? 0 : -1}
        title={p.canDrag ? 'Drag to reorder · Alt+↑/↓ move · F2 rename · Del delete' : 'Pinned'}
        className={`${row} text-[#3b3b3b] focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-[#0090f1] ${p.selected ? 'bg-[#e4e6f1]' : 'hover:bg-[#e8e8e8]'} ${p.dragged ? 'opacity-50' : ''}`}
        onClick={p.onClick} onDoubleClick={() => { if (!p.pinned) p.onRenameStart() }} onKeyDown={p.onKeyDown}
        onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', p.tab.id); p.onDragStart() }}
        onDragEnd={p.onDragEnd}>
        <AboutFileIcon pinned={p.pinned} />
        <AboutFileName title={p.tab.title} />
      </button>}
  </div>
}
