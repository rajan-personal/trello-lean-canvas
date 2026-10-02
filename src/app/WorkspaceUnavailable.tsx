import { useId, useRef, useState, type ChangeEvent } from 'react'
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

const buttonClass = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
const itemClass = `${buttonClass} flex min-h-9 w-full items-center rounded-md px-3 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white`

export function WorkspaceUnavailable({ route, onReturn, empty, onNew, onImport, onLoadSamples }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const positionMenu = () => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return
    const { bottom, left, width } = trigger.getBoundingClientRect()
    menu.style.left = `${Math.max(8, Math.min(left + width / 2 - 100, innerWidth - 208))}px`
    menu.style.top = `${Math.max(8, Math.min(bottom + 8, innerHeight - 130))}px`
  }
  const run = (action: () => void) => {
    menuRef.current?.hidePopover()
    action()
  }
  return <main className={`main-area h-full min-w-0 flex-1 ${route.kind === 'root' && empty ? 'flex items-center justify-center p-6' : ''}`}>
    {route.kind === 'root' && empty && <section className="w-full max-w-[360px] text-center">
      <h1 className="text-lg font-semibold text-white">No canvases yet</h1>
      <p className="mt-1.5 text-sm text-white/65">Create a Lean Canvas to map your idea on one page.</p>
      <button ref={triggerRef} type="button" aria-label="Canvas actions" title="New or import canvas"
        aria-controls={menuId} aria-expanded={open} popoverTarget={menuId} onClick={positionMenu}
        className={`${buttonClass} mx-auto mt-6 grid size-11 place-items-center rounded-full border border-white/30 text-white/80 hover:bg-white/10 hover:text-white`}>
        <Plus size={22} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <div ref={menuRef} id={menuId} popover="auto" role="group" aria-label="Canvas actions"
        onToggle={() => setOpen(menuRef.current?.matches(':popover-open') ?? false)}
        className="fixed inset-auto m-0 w-[200px] rounded-lg border border-white/20 bg-app-bg p-1.5">
        <button type="button" className={itemClass} onClick={() => run(onNew)}>New canvas</button>
        <button type="button" className={itemClass} onClick={() => run(() => inputRef.current?.click())}>Import YAML</button>
        <button type="button" className={itemClass} onClick={() => run(onLoadSamples)}>Try sample canvases</button>
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
