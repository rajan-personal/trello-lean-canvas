import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { AboutFileIcon, AboutFileName } from './about-file-icon'

interface Props {
  listId: string
  title: string
  pinned: boolean
  count: number
  open: boolean
  onToggle: (open: boolean) => void
  children: ReactNode
}

/** Mobile-only bar: shows the current section and expands the list in place of the editor. */
export function SectionToggle(p: Props) {
  return <div className="hidden h-11 shrink-0 items-center pe-1 max-[760px]:flex">
    <button type="button" aria-expanded={p.open} aria-controls={p.listId} onClick={() => p.onToggle(!p.open)}
      className="flex h-full min-w-0 flex-1 items-center gap-1.5 ps-2 text-left text-[13px] text-[#3b3b3b] focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-[#0090f1]">
      <ChevronRight size={16} aria-hidden="true" className={`shrink-0 text-[#424242] transition-transform ${p.open ? 'rotate-90' : ''}`} />
      <span className="text-[11px] font-bold text-[#616161] uppercase">Sections</span>
      <span className="sr-only">,</span>
      <AboutFileIcon pinned={p.pinned} />
      <AboutFileName title={p.title} />
      <span className="sr-only">, {p.count} total</span>
    </button>
    {p.children}
  </div>
}
