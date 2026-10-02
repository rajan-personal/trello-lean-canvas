import { useRef, type ChangeEvent } from 'react'
import type { WorkspaceRoute } from './workspace-route'

interface Props {
  route: WorkspaceRoute
  onReturn: () => void
  empty: boolean
  onNew: () => void
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
  onLoadSamples: () => void
}

const buttonClass = 'h-10 rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4]'

export function WorkspaceUnavailable({ route, onReturn, empty, onNew, onImport, onLoadSamples }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  return <main className="main-area h-full min-w-0 flex-1">
    {route.kind === 'root' && empty && <section className="mx-auto mt-[12vh] w-[min(420px,calc(100%-32px))] rounded-xl bg-white p-6 text-[#172b4d] shadow-[0_8px_24px_rgba(9,30,66,0.22)]">
      <h1 className="text-xl font-semibold">Start your first Lean Canvas</h1>
      <p className="mt-2 text-sm text-[#44546f]">Create a blank canvas, upload a YAML file, or explore four sample canvases.</p>
      <div className="mt-5 grid gap-2">
        <button type="button" className={`${buttonClass} bg-[#0c66e4] text-white`} onClick={onNew}>Create canvas</button>
        <button type="button" className={`${buttonClass} border border-[#8590a2] bg-white`} onClick={() => inputRef.current?.click()}>Upload YAML</button>
        <button type="button" className={`${buttonClass} text-[#0c66e4]`} onClick={onLoadSamples}>Load sample data</button>
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
