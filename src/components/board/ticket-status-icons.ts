import { LoaderCircle, type LucideIcon } from 'lucide-react'

/** Only in-progress gets an icon (spinner); Todo is plain and In Review is shown in bold. */
export const ticketStatusIcons: Record<'todo' | 'in-progress' | 'review', LucideIcon | null> = { todo: null, 'in-progress': LoaderCircle, review: null }
