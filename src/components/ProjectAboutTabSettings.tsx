import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { maxAboutTabTitle } from '../data/canvas-schema'
import type { AboutTab } from '../data/types'

interface Props {
  tab: AboutTab
  disabled: boolean
  focusName: boolean
  onFocused: () => void
  onRename: (title: string) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDelete: () => void
}
const iconButton = 'flex size-10 items-center justify-center rounded-md border border-[#dcdfe4] text-[#44546f] hover:bg-[#091e420f] focus-visible:outline-2 focus-visible:outline-[#0c66e4] disabled:opacity-40 max-[760px]:size-11'

export function ProjectAboutTabSettings(p: Props) {
  return <div className="mb-3 flex shrink-0 flex-wrap items-end gap-2">
    <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-semibold text-[#44546f]">Tab name
      <input key={p.tab.id} value={p.tab.title} maxLength={maxAboutTabTitle} disabled={p.disabled}
        autoFocus={p.focusName} onFocus={(event) => { if (p.focusName) { event.target.select(); p.onFocused() } }}
        onChange={(event) => p.onRename(event.target.value)}
        className="min-h-10 rounded-md border border-[#8590a2] px-3 text-sm font-normal text-[#172b4d] focus-visible:outline-2 focus-visible:outline-[#0c66e4] max-[760px]:min-h-11" />
    </label>
    <div className="flex gap-2">
      <button type="button" aria-label="Move tab up" title="Move up (Alt+Up)" disabled={p.disabled || !p.onMoveUp}
        onClick={p.onMoveUp} className={iconButton}><ArrowUp size={16} aria-hidden="true" /></button>
      <button type="button" aria-label="Move tab down" title="Move down (Alt+Down)" disabled={p.disabled || !p.onMoveDown}
        onClick={p.onMoveDown} className={iconButton}><ArrowDown size={16} aria-hidden="true" /></button>
      <button type="button" onClick={p.onDelete} disabled={p.disabled}
        className="flex min-h-10 items-center gap-1.5 rounded-md border border-[#dcdfe4] px-3 text-sm font-semibold text-[#ae2e24] hover:bg-[#ffeceb] focus-visible:outline-2 focus-visible:outline-[#0c66e4] disabled:opacity-60 max-[760px]:min-h-11">
        <Trash2 size={14} aria-hidden="true" />Delete tab
      </button>
    </div>
  </div>
}
