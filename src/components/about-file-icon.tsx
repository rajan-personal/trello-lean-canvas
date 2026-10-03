import { FileText, Info } from 'lucide-react'

/** VS Code–style file glyph: README-style info icon for the pinned Overview, markdown file otherwise. */
export function AboutFileIcon({ pinned }: { pinned: boolean }) {
  const Icon = pinned ? Info : FileText
  return <Icon size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-[#519aba]" />
}

export function AboutFileName({ title }: { title: string }) {
  return <span className="min-w-0 flex-1 truncate">{title.trim() || 'Untitled'}<span aria-hidden="true" className="text-[#8a8a8a]">.md</span></span>
}
