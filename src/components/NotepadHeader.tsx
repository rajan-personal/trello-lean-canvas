import { Maximize2, Minimize2, X } from 'lucide-react'

interface Props {
  id: string
  saving: boolean
  saveFailed: boolean
  onClose: () => void
  expanded: boolean
  onToggleExpanded: () => void
}

export function NotepadHeader({ id, saving, saveFailed, onClose, expanded, onToggleExpanded }: Props) {
  const close = () => {
    onClose()
    const opener = [...document.querySelectorAll<HTMLElement>('[aria-controls="canvas-notepad"]')]
      .find((element) => element.offsetParent !== null)
    const target = opener ?? document.querySelector<HTMLElement>('[aria-label="More actions"]')
    target?.focus()
  }
  return <header className="flex h-10 shrink-0 items-center gap-2 border-b border-[#d0d5dd] px-3">
    <h2 id={`${id}-label`} className="text-sm font-semibold text-[#172b4d]">Canvas notes</h2>
    <p id={`${id}-status`} className="ms-auto text-xs text-[#44546f]">{saveFailed ? 'Not saved' : saving ? 'Saving…' : 'Saved'}</p>
    <button type="button" aria-label={expanded ? 'Restore notepad width' : 'Expand notepad'}
      title={expanded ? 'Restore notepad width' : 'Expand notepad'} aria-pressed={expanded}
      onClick={onToggleExpanded}
      className="flex size-8 shrink-0 items-center justify-center rounded text-[#44546f] hover:bg-[#dcdfe4] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0c66e4] max-[761px]:hidden">
      {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
    <button type="button" aria-label="Close notepad" onClick={close}
      className="flex size-8 shrink-0 items-center justify-center rounded text-[#44546f] hover:bg-[#dcdfe4] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0c66e4]">
      <X size={16} />
    </button>
  </header>
}
