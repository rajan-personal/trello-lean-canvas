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
const row = 'flex h-8 w-full items-center gap-2 rounded px-2 text-left text-sm phone:h-11 phone:px-3'
const line = { before: 'before:absolute before:inset-x-1 before:-top-px before:h-0.5 before:rounded-full before:bg-[#0c66e4]',
  after: 'after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-[#0c66e4]', '': '' }

export function ProjectAboutTabRow({ buttonRef, ...p }: Props) {
  return <div className={`relative ${line[p.indicator]}`} onDragOver={p.onDragOver} onDrop={p.onDrop}>
    {p.renaming ? <div className={`${row} bg-[#e9f2ff] text-[#0055cc]`}>
      <AboutFileIcon pinned={false} />
      <input aria-label="Tab name" value={p.tab.title} maxLength={maxAboutTabTitle} autoFocus onFocus={(event) => event.target.select()}
        onChange={(event) => p.onRename(event.target.value)} onBlur={() => p.onRenameEnd(false, false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); p.onRenameEnd(false, true) }
          if (event.key === 'Escape') { event.preventDefault(); p.onRenameEnd(true, true) }
        }}
        className="h-6 min-w-0 flex-1 rounded-sm border border-[#0c66e4] bg-white px-1.5 text-sm text-[#172b4d] outline-none phone:h-9" />
    </div>
      : <button type="button" role="tab" id={`${p.id}-${p.tab.id}-tab`} ref={buttonRef} draggable={p.canDrag}
        aria-selected={p.selected} aria-controls={`${p.id}-panel`} tabIndex={p.selected ? 0 : -1}
        title={p.canDrag ? 'Drag to reorder · Alt+↑/↓ move · F2 rename · Del delete' : 'Pinned'}
        className={`${row} focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4] ${p.selected ? 'bg-[#e9f2ff] font-medium text-[#0055cc]' : 'text-[#44546f] hover:bg-[#dcdfe4] hover:text-[#172b4d]'} ${p.dragged ? 'opacity-50' : ''}`}
        onClick={p.onClick} onDoubleClick={() => { if (!p.pinned) p.onRenameStart() }} onKeyDown={p.onKeyDown}
        onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', p.tab.id); p.onDragStart() }}
        onDragEnd={p.onDragEnd}>
        <AboutFileIcon pinned={p.pinned} />
        <AboutFileName title={p.tab.title} />
      </button>}
  </div>
}
