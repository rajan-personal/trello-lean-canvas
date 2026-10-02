import { useRef, type ChangeEvent } from 'react'
import { Plus } from 'lucide-react'
import type { WorkspaceRoute } from './workspace-route'

interface Props {
  route: WorkspaceRoute
  onReturn: () => void
  empty: boolean
  onNew: () => void
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
  onLoadSamples: () => void
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
const linkClass = `h-8 rounded-md px-2 text-[13px] font-medium text-white/75 hover:bg-white/10 hover:text-white ${focusRing}`

/** Lean Canvas layout in miniature: five columns, two rows, then cost and revenue. */
const wireframeCells = [
  { area: 'col-start-1 row-start-1 row-span-2', lines: 2 },
  { area: 'col-start-2 row-start-1', lines: 1 },
  { area: 'col-start-2 row-start-2', lines: 0 },
  { area: 'col-start-3 row-start-1 row-span-2 !bg-white/20', lines: 1 },
  { area: 'col-start-4 row-start-1', lines: 0 },
  { area: 'col-start-4 row-start-2', lines: 1 },
  { area: 'col-start-5 row-start-1 row-span-2', lines: 2 },
  { area: 'col-start-1 col-span-5 row-start-3 grid grid-cols-2 gap-[3px]', lines: -1 },
]

function CanvasWireframe() {
  return <div aria-hidden="true" className="mx-auto grid h-[124px] w-[208px] grid-cols-5 grid-rows-[1fr_1fr_34px] gap-[3px]">
    {wireframeCells.map(({ area, lines }) => lines < 0
      ? <div key={area} className={area}>
        <div className="rounded-[4px] bg-white/[0.08]" />
        <div className="rounded-[4px] bg-white/[0.08]" />
      </div>
      : <div key={area} className={`flex flex-col gap-[3px] rounded-[4px] bg-white/[0.08] p-[5px] ${area}`}>
        {Array.from({ length: lines }, (_, index) => <span key={index} className={`h-[5px] rounded-full bg-white/35 ${index ? 'w-3/5' : ''}`} />)}
      </div>)}
  </div>
}

export function WorkspaceUnavailable({ route, onReturn, empty, onNew, onImport, onLoadSamples }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const showStarter = route.kind === 'root' && empty
  return <main className={`main-area h-full min-w-0 flex-1 ${showStarter ? 'flex items-center justify-center overflow-auto px-6 pt-6 pb-[12vh]' : ''}`}>
    {showStarter && <section className="w-full max-w-[400px] text-center">
      <CanvasWireframe />
      <h1 className="mt-8 text-[22px] leading-7 font-semibold tracking-[-0.01em] text-white">Start your first Lean Canvas</h1>
      <p className="mx-auto mt-2 max-w-[320px] text-sm leading-5 text-balance text-white/70">Map the problem, customers and value of an idea on a single page.</p>
      <button type="button" onClick={onNew}
        className={`mt-7 inline-flex h-10 items-center gap-1.5 rounded-md bg-white px-5 text-sm font-semibold text-[#172b4d] shadow-[0_1px_2px_rgba(9,30,66,0.25)] hover:bg-[#e9f2ff] ${focusRing}`}>
        <Plus size={16} strokeWidth={2.25} aria-hidden="true" />Create canvas
      </button>
      <div className="mt-3 flex items-center justify-center gap-1">
        <button type="button" className={linkClass} onClick={() => inputRef.current?.click()}>Upload YAML</button>
        <span aria-hidden="true" className="text-white/35">·</span>
        <button type="button" className={linkClass} onClick={onLoadSamples}>Load sample data</button>
      </div>
      <input ref={inputRef} type="file" className="hidden" aria-label="Upload starter canvas YAML file"
        accept=".yaml,.yml,text/yaml,application/yaml" onChange={onImport} />
    </section>}
    {route.kind !== 'root' && <div role="alert" className="p-4 text-white">
      {route.kind === 'missing' ? 'Page not found.' : 'This project is unavailable. It may have been deleted or you may not have access.'}
      <button className="ml-3 underline" onClick={onReturn}>Go to workspace</button>
    </div>}
  </main>
}
