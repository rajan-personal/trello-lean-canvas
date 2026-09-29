import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, KeyRound, LogOut } from 'lucide-react'
import { PasswordDialog } from '../auth/PasswordDialog'
import type { AppUser } from '../auth/auth-context'
import { usePendingAction } from './usePendingAction'
import { useAccountMenu } from './useAccountMenu'
import { SyncError } from './SyncError'

interface Props {
  user: AppUser
  onSignOut: () => void | Promise<void>
  onSetPassword?: (password: string) => Promise<void>
}
const itemClass = 'flex min-h-9 w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-[#f4f4f5] focus:bg-[#f4f4f5] disabled:opacity-50'
export function AccountButton({ user, onSignOut, onSetPassword }: Props) {
  const [passwordOpen, setPasswordOpen] = useState(false)
  const { id, trigger, panel, open, nativePopover, show, close, keydown } = useAccountMenu()
  const { pending, failed, run } = usePendingAction(onSignOut)
  const label = user.email || user.displayName || 'Google account'
  return <>
    <button ref={trigger} type="button" aria-busy={pending}
      aria-label={`Account ${label}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => open ? close() : show()}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(event.key === 'ArrowUp') }
      }}
      className="sidebar-account flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-white/85 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50">
      <span className="min-w-0 flex-1 truncate" title={label}>{pending ? 'Signing out…' : label}</span>
      <ChevronDown size={14} aria-hidden="true" className={`shrink-0 ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && createPortal(<div ref={panel} id={id} role="menu" aria-label="Account actions"
      popover={nativePopover ? 'manual' : undefined} onKeyDown={keydown}
      className="fixed inset-auto z-[100] m-0 w-[220px] max-w-[calc(100vw-16px)] rounded-md border border-[#e4e4e7] bg-white p-1 text-[#18181b] shadow-md">
      {onSetPassword && user.email && <>
        <button role="menuitem" tabIndex={-1} type="button" disabled={pending} className={itemClass}
          onClick={() => { close(); setPasswordOpen(true) }}><KeyRound size={15} aria-hidden="true" />{user.hasPassword ? 'Change password' : 'Set password'}</button>
        <div role="separator" className="-mx-1 my-1 h-px bg-[#e4e4e7]" />
      </>}
      <button role="menuitem" tabIndex={-1} type="button" disabled={pending} aria-busy={pending} className={itemClass}
        aria-label={`${pending ? 'Signing out' : 'Sign out'} ${label}`} onClick={() => void run()}>
        <LogOut size={15} aria-hidden="true" />{pending ? 'Signing out…' : 'Sign out'}
      </button>
    </div>, document.body)}
    {passwordOpen && onSetPassword && user.email && <PasswordDialog email={user.email} hasPassword={Boolean(user.hasPassword)}
      onSave={onSetPassword} onClose={() => { setPasswordOpen(false); trigger.current?.focus() }} />}
    {failed && <SyncError message="Sign out failed. Please try again." />}
  </>
}
