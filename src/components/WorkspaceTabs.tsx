import { useId, useRef } from 'react'
import { Columns3, LayoutDashboard } from 'lucide-react'

export type WorkspaceView = 'canvas' | 'board'
interface Props { view: WorkspaceView; onChange: (view: WorkspaceView) => boolean; idPrefix?: string }
const tabs = ['canvas', 'board'] as const

export function WorkspaceTabs({ view, onChange, idPrefix }: Props) {
  const generatedId = useId()
  const prefix = idPrefix === '' ? '' : `${idPrefix ?? generatedId}-`
  const buttons = useRef<Partial<Record<WorkspaceView, HTMLButtonElement | null>>>({})
  const select = (next: WorkspaceView) => {
    buttons.current[onChange(next) ? next : view]?.focus()
  }
  return <div role="tablist" aria-label="Canvas views" className="workspace-tabs me-1 flex w-fit shrink-0 gap-0.5 rounded-lg bg-[#073650] p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]">
    {tabs.map((tab) => <button key={tab} id={`${prefix}${tab}-tab`} role="tab"
      ref={(button) => { buttons.current[tab] = button }}
      aria-selected={view === tab} aria-controls={`${prefix}${tab}-panel`} tabIndex={view === tab ? 0 : -1}
      className={`flex min-h-8 items-center justify-center gap-1 rounded-md px-2.5 text-sm font-semibold max-[760px]:min-h-9 max-[760px]:px-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${view === tab ? 'bg-[#f4f7fa] hover:bg-white text-[#12344a] shadow-[0_1px_3px_rgba(0,0,0,0.2)]' : 'text-[#e2edf4] hover:bg-white/15 hover:text-white'}`}
      onClick={() => select(tab)} onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        select(event.key === 'Home' ? 'canvas' : event.key === 'End' ? 'board' : tab === 'canvas' ? 'board' : 'canvas')
      }}>
        {tab === 'canvas' ? <LayoutDashboard size={14} aria-hidden="true" /> : <Columns3 size={14} aria-hidden="true" />}
        {tab === 'canvas' ? 'Canvas' : 'Board'}
      </button>)}
  </div>
}
