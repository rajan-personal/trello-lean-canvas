import { useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { ProjectAboutTabRow } from './ProjectAboutTabRow'
import type { AboutTab } from '../data/types'
import { getCanvasDropEdge } from './sidebar-drag'

interface Props {
  id: string
  tabs: AboutTab[]
  active: string
  pinned: string
  renaming: string | null
  canMove: boolean
  addButton: ReactNode
  /** Mobile only: whether the section list replaces the editor. */
  open: boolean
  switcherRef: RefObject<HTMLButtonElement | null>
  /** Arrow navigation selects without closing the mobile list; activation closes it. */
  onSelect: (tabId: string, activate: boolean) => void
  /** Moves a tab to an index within the reorderable (non-pinned) tabs. */
  onMove: (tabId: string, index: number) => void
  onRename: (tabId: string, title: string) => void
  onRenameStart: (tabId: string) => void
  onRenameEnd: (cancel: boolean, close: boolean) => void
  onDelete: (tabId: string) => void
}
type Target = { tabId: string; edge: 'before' | 'after' }

export function ProjectAboutTabs(p: Props) {
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({})
  const [dragged, setDragged] = useState<string | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const movable = p.tabs.filter((tab) => tab.id !== p.pinned)
  const focus = (tabId: string) => requestAnimationFrame(() => {
    const button = buttons.current[tabId]
    // After mobile activation/rename the tab is hidden. Return to its visible trigger.
    const target = button?.getClientRects().length ? button : p.switcherRef.current
    target?.focus()
  })
  const select = (tabId: string, activate = false) => { p.onSelect(tabId, activate); focus(tabId) }
  const reset = () => { setDragged(null); setTarget(null) }
  const edgeFor = (tabId: string, event: Parameters<typeof getCanvasDropEdge>[0]) => tabId === p.pinned ? 'after' : getCanvasDropEdge(event)
  const drop = (targetId: string, edge: 'before' | 'after') => {
    const source = movable.findIndex((tab) => tab.id === dragged)
    if (!dragged || source < 0 || dragged === targetId) return reset()
    const destination = targetId === p.pinned ? 0 : movable.findIndex((tab) => tab.id === targetId) + (edge === 'after' ? 1 : 0)
    p.onMove(dragged, destination - (source < destination ? 1 : 0))
    reset()
  }
  const keyDown = (tab: AboutTab, index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const locked = tab.id === p.pinned || !p.canMove
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault()
      if (!locked) { p.onMove(tab.id, movable.findIndex((item) => item.id === tab.id) + (event.key === 'ArrowUp' ? -1 : 1)); focus(tab.id) }
      return
    }
    if (event.key === 'F2' && !locked) { event.preventDefault(); p.onRenameStart(tab.id); return }
    if (event.key === 'Delete' && !locked) { event.preventDefault(); p.onDelete(tab.id); focus(p.tabs[index - 1]?.id ?? p.pinned); return }
    const up = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    if (!up && event.key !== 'ArrowDown' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    select(event.key === 'Home' ? p.tabs[0].id : event.key === 'End' ? p.tabs[p.tabs.length - 1].id
      : p.tabs[(index + (up ? -1 : 1) + p.tabs.length) % p.tabs.length].id)
  }
  return <div className={`col-start-1 row-span-2 row-start-1 flex min-h-0 flex-col border-r border-[#dcdfe4] bg-[#f7f8f9] max-[760px]:border-r-0 max-[760px]:bg-white ${p.open ? 'max-[760px]:flex-1' : 'max-[760px]:hidden'}`}>
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#dcdfe4] ps-4 pe-2 max-[760px]:hidden">
      <span className="text-xs font-semibold text-[#44546f]">Sections</span>
      {p.addButton}
    </div>
    <div role="tablist" id={`${p.id}-sections`} aria-label="About sections" aria-orientation="vertical"
      className="flex min-h-0 flex-col gap-px overflow-y-auto p-2">
      {p.tabs.map((tab, index) => <ProjectAboutTabRow key={tab.id} id={p.id} tab={tab} selected={tab.id === p.active}
        pinned={tab.id === p.pinned} canDrag={p.canMove && tab.id !== p.pinned} dragged={dragged === tab.id}
        indicator={dragged && target?.tabId === tab.id ? target.edge : ''} renaming={p.renaming === tab.id}
        buttonRef={(button) => { buttons.current[tab.id] = button }} onClick={() => select(tab.id, true)}
        onRename={(title) => p.onRename(tab.id, title)} onRenameStart={() => p.onRenameStart(tab.id)}
        onRenameEnd={(cancel, refocus) => { p.onRenameEnd(cancel, refocus); if (refocus) focus(tab.id) }} onKeyDown={keyDown(tab, index)}
        onDragStart={() => setDragged(tab.id)} onDragEnd={reset}
        onDragOver={(event) => {
          if (!dragged) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
          if (dragged !== tab.id) setTarget({ tabId: tab.id, edge: edgeFor(tab.id, event) })
        }}
        onDrop={(event) => { event.preventDefault(); drop(tab.id, edgeFor(tab.id, event)) }} />)}
    </div>
  </div>
}
