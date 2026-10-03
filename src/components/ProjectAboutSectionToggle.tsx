import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  listId: string
  title: string
  count: number
  open: boolean
  onToggle: (open: boolean) => void
  children: ReactNode
}

/** Mobile-only bar: shows the current section and expands the list in place of the editor. */
export function SectionToggle(p: Props) {
  return <div className="hidden items-center gap-1 rounded-md border border-[#dcdfe4] bg-white max-[760px]:flex">
    <button type="button" aria-expanded={p.open} aria-controls={p.listId} onClick={() => p.onToggle(!p.open)}
      className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md ps-3 pe-2 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4]">
      <span className="text-[11px] font-semibold tracking-wide text-[#44546f] uppercase">Sections</span>
      <span className="min-w-0 flex-1 truncate font-semibold text-[#172b4d]">{p.title}</span>
      <span className="sr-only">, {p.count} total</span>
      <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-[#44546f] transition-transform ${p.open ? 'rotate-180' : ''}`} />
    </button>
    {p.children}
  </div>
}
