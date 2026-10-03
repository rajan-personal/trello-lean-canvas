import { ArrowDown, ArrowUp, Pencil, Trash2, type LucideIcon } from 'lucide-react'
import type { AboutTab } from '../data/types'
import { AboutFileIcon, AboutFileName } from './about-file-icon'

interface Props {
  tab: AboutTab
  pinned: boolean
  disabled: boolean
  onRename: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDelete: () => void
}

function Action({ icon: Icon, label, title, onClick, disabled }: { icon: LucideIcon; label: string; title: string; onClick?: () => void; disabled: boolean }) {
  return <button type="button" aria-label={label} title={title} onClick={onClick} disabled={disabled || !onClick}
    className="flex size-7 items-center justify-center rounded-[5px] text-[#424242] hover:bg-[#dadada] focus-visible:outline-1 focus-visible:outline-[#0090f1] disabled:opacity-35 disabled:hover:bg-transparent max-[760px]:size-11">
    <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
  </button>
}

/** VS Code–style editor title bar: the open section as a tab, with its actions on the right.
 * On phones the section switcher already names the file, so only the actions remain. */
export function ProjectAboutEditorHeader(p: Props) {
  return <div className={`flex h-[35px] shrink-0 items-stretch justify-between border-b border-[#e5e5e5] bg-[#f3f3f3] font-[system-ui,-apple-system,'Segoe_UI',sans-serif] max-[760px]:h-11 max-[760px]:justify-end ${p.pinned ? 'max-[760px]:hidden' : ''}`}>
    <div className="flex min-w-0 max-w-full items-center gap-1.5 max-[760px]:hidden border-r border-[#e5e5e5] bg-white ps-3 pe-4 text-[13px] text-[#333]">
      <AboutFileIcon pinned={p.pinned} />
      <AboutFileName title={p.tab.title} />
    </div>
    {!p.pinned && <div className="flex shrink-0 items-center gap-0.5 pe-1.5">
      <Action icon={Pencil} label="Rename tab" title="Rename (F2)" onClick={p.onRename} disabled={p.disabled} />
      <Action icon={ArrowUp} label="Move tab up" title="Move up (Alt+↑)" onClick={p.onMoveUp} disabled={p.disabled} />
      <Action icon={ArrowDown} label="Move tab down" title="Move down (Alt+↓)" onClick={p.onMoveDown} disabled={p.disabled} />
      <Action icon={Trash2} label="Delete tab" title="Delete (Del)" onClick={p.onDelete} disabled={p.disabled} />
    </div>}
  </div>
}
