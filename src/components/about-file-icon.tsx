import { FileText, Info } from 'lucide-react'

/** Section glyph: info for the pinned Overview, a page for every other section. */
export function AboutFileIcon({ pinned }: { pinned: boolean }) {
  const Icon = pinned ? Info : FileText
  return <Icon size={16} aria-hidden="true" className="shrink-0 opacity-80" />
}

export function AboutFileName({ title }: { title: string }) {
  return <span className="min-w-0 flex-1 truncate">{title.trim() || 'Untitled'}</span>
}
