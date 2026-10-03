import { useRef } from 'react'
import { Plus } from 'lucide-react'
import type { AboutTab } from '../data/types'

interface Props {
  id: string
  tabs: AboutTab[]
  active: string
  canAdd: boolean
  addTitle: string
  onSelect: (tabId: string) => void
  onAdd: () => void
}

export function ProjectAboutTabs({ id, tabs, active, canAdd, addTitle, onSelect, onAdd }: Props) {
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({})
  const select = (tabId: string) => { onSelect(tabId); buttons.current[tabId]?.focus() }
  return <div className="mb-3 flex shrink-0 items-end gap-1 border-b border-[#dcdfe4]">
    <div role="tablist" aria-label="About sections" className="flex min-w-0 gap-1 overflow-x-auto">
      {tabs.map((tab, index) => <button key={tab.id} type="button" role="tab" id={`${id}-${tab.id}-tab`}
        ref={(button) => { buttons.current[tab.id] = button }}
        aria-selected={tab.id === active} aria-controls={`${id}-panel`} tabIndex={tab.id === active ? 0 : -1}
        className={`-mb-px max-w-48 shrink-0 truncate border-b-2 px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4] max-[760px]:min-h-11 ${tab.id === active ? 'border-[#0c66e4] text-[#0c66e4]' : 'border-transparent text-[#44546f] hover:text-[#172b4d]'}`}
        onClick={() => select(tab.id)} onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const offset = event.key === 'ArrowLeft' ? -1 : 1
          select(event.key === 'Home' ? tabs[0].id : event.key === 'End' ? tabs[tabs.length - 1].id : tabs[(index + offset + tabs.length) % tabs.length].id)
        }}>{tab.title.trim() || 'Untitled'}</button>)}
    </div>
    <button type="button" onClick={onAdd} disabled={!canAdd} title={addTitle}
      className="mb-1 flex min-h-8 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-semibold text-[#44546f] hover:bg-[#091e420f] hover:text-[#172b4d] focus-visible:outline-2 focus-visible:outline-[#0c66e4] disabled:opacity-50 max-[760px]:min-h-11">
      <Plus size={14} aria-hidden="true" /><span>Add tab</span>
    </button>
  </div>
}
