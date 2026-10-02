import { useRef, type ChangeEvent } from 'react'
import { LayoutGrid, Plus } from 'lucide-react'
import type { WorkspaceRoute } from './workspace-route'

interface Props {
  route: WorkspaceRoute
  onReturn: () => void
  empty: boolean
  onNew: () => void
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
  onLoadSamples: () => void
}

const buttonClass = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export function WorkspaceUnavailable({ route, onReturn, empty, onNew, onImport, onLoadSamples }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  return <main className={`main-area h-full min-w-0 flex-1 ${route.kind === 'root' && empty ? 'flex items-center justify-center p-6' : ''}`}>
    {route.kind === 'root' && empty && <section className="w-full max-w-[360px] text-center">
      <LayoutGrid size={28} strokeWidth={1.5} className="mx-auto mb-5 text-white/60" aria-hidden="true" />
      <h1 className="text-lg font-semibold text-white">No canvases yet</h1>
      <p className="mt-1.5 text-sm text-white/65">Create a Lean Canvas to map your idea on one page.</p>
      <button type="button" className={`${buttonClass} mt-6 inline-flex h-9 items-center gap-1.5 rounded-md bg-white px-4 text-sm font-medium text-[#172b4d] hover:bg-white/90`} onClick={onNew}>
        <Plus size={16} aria-hidden="true" />New canvas
      </button>
      <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-white/65">
        <button type="button" className={`${buttonClass} underline-offset-4 hover:text-white hover:underline`} onClick={() => inputRef.current?.click()}>Import YAML</button>
        <span aria-hidden="true">·</span>
        <button type="button" className={`${buttonClass} underline-offset-4 hover:text-white hover:underline`} onClick={onLoadSamples}>Try sample canvases</button>
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
