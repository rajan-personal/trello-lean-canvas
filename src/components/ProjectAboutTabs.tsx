import { useRef, useState } from 'react'
import { GripVertical, Plus } from 'lucide-react'
import { SectionToggle } from './ProjectAboutSectionToggle'
import type { AboutTab } from '../data/types'
import { getCanvasDropEdge } from './sidebar-drag'

interface Props {
  id: string
  tabs: AboutTab[]
  active: string
  pinned: string
  canAdd: boolean
  canMove: boolean
  addTitle: string
  /** Mobile only: whether the section list replaces the editor. */
  open: boolean
  onToggle: (open: boolean) => void
  onSelect: (tabId: string) => void
  onAdd: () => void
  /** Moves a tab to an index within the reorderable (non-pinned) tabs. */
  onMove: (tabId: string, index: number) => void
}
type Target = { tabId: string; edge: 'before' | 'after' }
const moveHint = 'Drag to reorder. Press Alt+Up or Alt+Down to move.'

export function ProjectAboutTabs(p: Props) {
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({})
  const [dragged, setDragged] = useState<string | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const movable = p.tabs.filter((tab) => tab.id !== p.pinned)
  const select = (tabId: string) => { p.onSelect(tabId); buttons.current[tabId]?.focus() }
  const current = p.tabs.find((tab) => tab.id === p.active)
  const add = <button type="button" onClick={p.onAdd} disabled={!p.canAdd} aria-label="Add tab" title={p.addTitle}
    className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#44546f] hover:bg-[#091e420f] hover:text-[#172b4d] focus-visible:outline-2 focus-visible:outline-[#0c66e4] disabled:opacity-50 max-[760px]:size-11">
    <Plus size={16} aria-hidden="true" />
  </button>
  const move = (tabId: string, index: number) => {
    p.onMove(tabId, index)
    requestAnimationFrame(() => buttons.current[tabId]?.focus())
  }
  const reset = () => { setDragged(null); setTarget(null) }
  const drop = (targetId: string, edge: 'before' | 'after') => {
    const source = movable.findIndex((tab) => tab.id === dragged)
    if (!dragged || source < 0 || dragged === targetId) return reset()
    const destination = targetId === p.pinned ? 0 : movable.findIndex((tab) => tab.id === targetId) + (edge === 'after' ? 1 : 0)
    p.onMove(dragged, destination - (source < destination ? 1 : 0))
    reset()
  }
  return <div className={`flex w-52 shrink-0 flex-col border-r border-[#dcdfe4] pr-3 max-[760px]:w-full max-[760px]:border-r-0 max-[760px]:pr-0 ${p.open ? 'max-[760px]:min-h-0 max-[760px]:flex-1' : ''}`}>
    <div className="mb-1 flex items-center justify-between ps-2 max-[760px]:hidden">
      <span className="text-[11px] font-semibold tracking-wide text-[#44546f] uppercase">Sections</span>
      {add}
    </div>
    <SectionToggle listId={`${p.id}-sections`} title={current?.title.trim() || 'Untitled'} count={p.tabs.length}
      open={p.open} onToggle={p.onToggle}>{add}</SectionToggle>
    <div role="tablist" id={`${p.id}-sections`} aria-label="About sections" aria-orientation="vertical"
      className={`flex min-h-0 flex-col gap-0.5 overflow-y-auto max-[760px]:mt-2 ${p.open ? '' : 'max-[760px]:hidden'}`}>
      {p.tabs.map((tab, index) => {
        const selected = tab.id === p.active
        const canDrag = p.canMove && tab.id !== p.pinned
        const indicator = dragged && target?.tabId === tab.id ? target.edge === 'before'
          ? 'before:absolute before:inset-x-1 before:-top-px before:h-0.5 before:rounded-full before:bg-[#0c66e4]'
          : 'after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:bg-[#0c66e4]' : ''
        return <div key={tab.id} className={`relative ${indicator}`}
          onDragOver={(event) => {
            if (!dragged) return
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
            if (dragged !== tab.id) setTarget({ tabId: tab.id, edge: tab.id === p.pinned ? 'after' : getCanvasDropEdge(event) })
          }}
          onDrop={(event) => { event.preventDefault(); drop(tab.id, tab.id === p.pinned ? 'after' : getCanvasDropEdge(event)) }}>
          <button type="button" role="tab" id={`${p.id}-${tab.id}-tab`} draggable={canDrag}
            ref={(button) => { buttons.current[tab.id] = button }} title={canDrag ? moveHint : undefined}
            aria-selected={selected} aria-controls={`${p.id}-panel`} tabIndex={selected ? 0 : -1}
            className={`group flex min-h-9 w-full items-center gap-1.5 rounded-md border-l-2 py-1.5 ps-2 pe-2 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4] max-[760px]:min-h-11 ${selected ? 'border-[#0c66e4] bg-[#e9f2ff] font-semibold text-[#0c66e4]' : 'border-transparent font-medium text-[#44546f] hover:bg-[#091e420f] hover:text-[#172b4d]'} ${dragged === tab.id ? 'opacity-50' : ''}`}
            onClick={() => select(tab.id)}
            onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', tab.id); setDragged(tab.id) }}
            onDragEnd={reset}
            onKeyDown={(event) => {
              const up = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
              const down = event.key === 'ArrowDown' || event.key === 'ArrowRight'
              if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                event.preventDefault()
                const at = movable.findIndex((item) => item.id === tab.id)
                if (canDrag) move(tab.id, at + (event.key === 'ArrowUp' ? -1 : 1))
                return
              }
              if (!up && !down && event.key !== 'Home' && event.key !== 'End') return
              event.preventDefault()
              select(event.key === 'Home' ? p.tabs[0].id : event.key === 'End' ? p.tabs[p.tabs.length - 1].id
                : p.tabs[(index + (up ? -1 : 1) + p.tabs.length) % p.tabs.length].id)
            }}>
            <GripVertical size={14} aria-hidden="true" className={`shrink-0 ${canDrag ? 'cursor-grab opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60' : 'invisible'}`} />
            <span className="min-w-0 flex-1 truncate">{tab.title.trim() || 'Untitled'}</span>
          </button>
        </div>
      })}
    </div>
  </div>
}
