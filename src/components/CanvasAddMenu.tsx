import { useId, useRef, useState, type ChangeEvent } from 'react'
import { Plus } from 'lucide-react'
import { brandActionButtonClass } from './workspace-classes'

interface Props {
  onNew: () => void
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
  onLoadSamples: () => void
}

const itemClass =
  'flex min-h-9 w-full items-center rounded-md border-0 bg-transparent px-3 text-left text-sm font-medium text-[#172b4d] hover:bg-[#f1f2f4] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4]'

export function CanvasAddMenu({ onNew, onImport, onLoadSamples }: Props) {
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)

  const positionMenu = () => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return
    const { bottom, right } = trigger.getBoundingClientRect()
    menu.style.left = `${Math.max(8, Math.min(right - 160, innerWidth - 168))}px`
    menu.style.top = `${bottom + 6}px`
  }
  const run = (action: () => void) => {
    menuRef.current?.hidePopover()
    action()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${brandActionButtonClass} new-canvas-button ms-auto`}
        aria-label="Add canvas"
        aria-controls={menuId}
        aria-expanded={open}
        popoverTarget={menuId}
        onClick={positionMenu}
      >
        <Plus size={20} />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="group"
        aria-label="Add canvas options"
        className="fixed inset-auto m-0 w-40 rounded-lg border border-[#dcdfe4] bg-white p-1.5 shadow-[0_8px_24px_rgba(9,30,66,0.22)]"
        onToggle={() => setOpen(menuRef.current?.matches(':popover-open') ?? false)}
      >
        <button type="button" className={itemClass} onClick={() => run(onNew)}>
          New
        </button>
        <button
          type="button"
          className={itemClass}
          onClick={() => run(() => inputRef.current?.click())}
        >
          Upload
        </button>
        <button
          type="button"
          className={itemClass}
          onClick={() => run(onLoadSamples)}
        >
          Sample
        </button>
      </div>
      <input
        ref={inputRef}
        className="file-input hidden"
        type="file"
        accept=".yaml,.yml,text/yaml,application/yaml"
        aria-label="Upload canvas YAML file"
        onChange={onImport}
      />
    </>
  )
}
