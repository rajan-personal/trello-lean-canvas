export type WorkspaceView = 'canvas' | 'board'
interface Props { view: WorkspaceView; onChange: (view: WorkspaceView) => boolean }
const tabs = ['canvas', 'board'] as const

export function WorkspaceTabs({ view, onChange }: Props) {
  const select = (next: WorkspaceView) => {
    if (onChange(next)) document.getElementById(`${next}-tab`)?.focus()
  }
  return <div role="tablist" aria-label="Canvas views" className="ms-2 flex shrink-0 gap-0.5 max-[760px]:absolute max-[760px]:inset-x-0 max-[760px]:top-12 max-[760px]:ms-0 max-[760px]:h-11 max-[760px]:items-center max-[760px]:bg-[#0b4a6f] max-[760px]:px-3">
    {tabs.map((tab) => <button key={tab} id={`${tab}-tab`} role="tab"
      aria-selected={view === tab} aria-controls={`${tab}-panel`} tabIndex={view === tab ? 0 : -1}
      className={`min-h-8 rounded px-2 text-sm font-semibold max-[760px]:min-h-11 max-[760px]:px-4 focus-visible:outline-2 focus-visible:outline-white ${view === tab ? 'bg-white/25' : 'hover:bg-white/15'}`}
      onClick={() => select(tab)} onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        select(event.key === 'Home' ? 'canvas' : event.key === 'End' ? 'board' : tab === 'canvas' ? 'board' : 'canvas')
      }}>{tab === 'canvas' ? 'Canvas' : 'Board'}</button>)}
  </div>
}
