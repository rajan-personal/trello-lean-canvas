import { Bot } from 'lucide-react'

export function CommentAvatar({ name, agent = false }: { name: string; agent?: boolean }) {
  const words = name.trim().split(/\s+/)
  const initials = [words[0], ...(words.length > 1 ? [words.at(-1)!] : [])]
    .map((word) => [...word][0] ?? '').join('').toLocaleUpperCase()
  return <span className={`kanban-comment-avatar${agent ? ' is-agent' : ''}`} aria-hidden="true">
    {agent ? <Bot size={18} strokeWidth={1.8} /> : initials || '?'}
  </span>
}
