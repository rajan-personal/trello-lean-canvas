import type { ReactNode, Ref } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Pencil, Trash2, type LucideIcon } from 'lucide-react'
import type { AboutTab } from '../data/types'
import { AboutFileIcon, AboutFileName } from './about-file-icon'

interface Props {
  tab: AboutTab
  pinned: boolean
  disabled: boolean
  statusId: string
  status: string
  saveLabel: string
  canSave: boolean
  listId: string
  switcherRef: Ref<HTMLButtonElement>
  count: number
  open: boolean
  onToggle: (open: boolean) => void
  addButton: ReactNode
  onRename: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDelete: () => void
}

export const iconButton = 'flex size-8 shrink-0 items-center justify-center rounded text-[#44546f] hover:bg-[#dcdfe4] hover:text-[#172b4d] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4] disabled:opacity-40 disabled:hover:bg-transparent max-[760px]:size-11'

function Action({ icon: Icon, label, title, onClick, disabled, danger }: { icon: LucideIcon; label: string; title: string; onClick?: () => void; disabled: boolean; danger?: boolean }) {
  return <button type="button" aria-label={label} title={title} onClick={onClick} disabled={disabled || !onClick}
    className={`${iconButton} ${danger ? 'hover:bg-[#ffeceb] hover:text-[#ae2e24]' : ''}`}>
    <Icon size={16} aria-hidden="true" />
  </button>
}

/** Title bar of the open section: name and section actions on the left, save state on the right.
 * Phones: the name becomes the section switcher and the bar wraps onto a second row of actions. */
export function ProjectAboutEditorHeader({ switcherRef, ...p }: Props) {
  return <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-1 border-b border-[#dcdfe4] ps-4 pe-3 max-[760px]:px-1">
    <div className="order-1 flex min-w-0 items-center gap-2 pe-1 text-sm font-semibold text-[#172b4d] max-[760px]:hidden">
      <AboutFileIcon pinned={p.pinned} />
      <AboutFileName title={p.tab.title} />
    </div>
    <button ref={switcherRef} type="button" aria-expanded={p.open} aria-controls={p.listId} onClick={() => p.onToggle(!p.open)}
      className="order-1 my-0.5 hidden h-11 min-w-0 flex-1 items-center gap-2 rounded px-2 text-left text-sm font-semibold text-[#172b4d] hover:bg-[#f1f2f4] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4] max-[760px]:flex">
      <span className="sr-only">Sections, </span>
      <AboutFileIcon pinned={p.pinned} />
      <AboutFileName title={p.tab.title} />
      <span className="sr-only">, {p.count} total</span>
      <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-[#44546f] transition-transform ${p.open ? 'rotate-180' : ''}`} />
    </button>
    {!p.pinned && <div className="order-2 flex items-center gap-0.5 max-[760px]:order-4">
      <Action icon={Pencil} label="Rename tab" title="Rename (F2)" onClick={p.onRename} disabled={p.disabled} />
      <Action icon={ArrowUp} label="Move tab up" title="Move up (Alt+↑)" onClick={p.onMoveUp} disabled={p.disabled} />
      <Action icon={ArrowDown} label="Move tab down" title="Move down (Alt+↓)" onClick={p.onMoveDown} disabled={p.disabled} />
      <Action icon={Trash2} label="Delete tab" title="Delete (Del)" onClick={p.onDelete} disabled={p.disabled} danger />
    </div>}
    <p id={p.statusId} role="status" className="order-3 ms-auto truncate ps-2 text-xs text-[#44546f] max-[760px]:order-5 max-[760px]:min-w-0 max-[760px]:flex-1 max-[760px]:text-right">{p.status}</p>
    <button type="submit" disabled={!p.canSave}
      className="order-4 ms-2 min-h-8 shrink-0 rounded-md bg-[#0c66e4] px-3 text-sm font-semibold text-white hover:bg-[#0055cc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:opacity-50 max-[760px]:order-2 max-[760px]:my-0.5 max-[760px]:me-1 max-[760px]:min-h-11 max-[760px]:px-4">{p.saveLabel}</button>
    <div aria-hidden="true" className="order-3 hidden basis-full border-t border-[#dcdfe4] max-[760px]:block" />
    <div className="order-6 hidden max-[760px]:block">{p.addButton}</div>
  </div>
}
