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

const linkClass = 'rounded-sm hover:text-white hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export function WorkspaceUnavailable({ route, onReturn, empty, onNew, onImport, onLoadSamples }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  return <main className={`main-area h-full min-w-0 flex-1 ${route.kind === 'root' && empty ? 'flex items-center justify-center p-6' : ''}`}>
    {route.kind === 'root' && empty && <section className="w-full max-w-[400px] text-center">
      <h1 className="text-xl font-semibold text-white">No canvases yet</h1>
      <p className="mt-2 text-sm text-white/70 text-balance">
        Map your idea on a single page.
      </p>
      <button type="button" onClick={onNew}
        className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-md bg-white px-4 text-sm font-semibold text-[#172b4d] shadow-sm hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <Plus size={16} aria-hidden="true" />New canvas
      </button>
      <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-white/70">
        <button type="button" onClick={() => inputRef.current?.click()} className={linkClass}>Import YAML</button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={onLoadSamples} className={linkClass}>Try sample canvases</button>
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
