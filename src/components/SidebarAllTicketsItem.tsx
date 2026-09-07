import { List } from 'lucide-react'
interface Props { active: boolean; onClick: () => void }
export function SidebarAllTicketsItem({ active, onClick }: Props) {
  return <button type="button" className={`flex min-h-[38px] w-full items-center justify-start gap-2 rounded-md border-0 px-3.5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white ${active ? 'bg-white/16' : 'bg-transparent'}`} aria-current={active ? 'page' : undefined} onClick={onClick}>
    <List size={16} aria-hidden="true" /><span>All tickets</span>
  </button>
}
