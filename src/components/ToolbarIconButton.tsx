import type { MouseEventHandler, ReactNode } from 'react'
import { toolbarButtonClass } from './workspace-classes'

interface Props {
  label: string
  title?: string
  onClick: MouseEventHandler<HTMLButtonElement>
  children: ReactNode
  active?: boolean
  pressed?: boolean
}
export function ToolbarIconButton({
  label,
  title,
  onClick,
  children,
  active = false,
  pressed,
}: Props) {
  return (
    <button
      className={`toolbar-icon ${toolbarButtonClass} ${active ? 'text-[#f5cd47]' : ''}`}
      aria-label={label}
      aria-pressed={pressed}
      title={title ?? label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
