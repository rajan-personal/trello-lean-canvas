import { LogOut } from 'lucide-react'
import type { AppUser } from '../auth/auth-context'

interface Props {
  user: AppUser
  onSignOut: () => void
}

export function AccountButton({ user, onSignOut }: Props) {
  const label = user.email || user.displayName || 'Google account'
  return (
    <button
      type="button"
      onClick={onSignOut}
      className="ms-1 inline-flex h-8 max-w-48 items-center gap-2 rounded-md px-1.5 text-sm font-semibold text-white hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white max-[640px]:gap-0 max-[640px]:px-1"
      aria-label={`Sign out ${label}`}
      title={`Sign out ${label}`}
    >
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          referrerPolicy="no-referrer"
          className="size-6 rounded-full bg-white max-[640px]:hidden"
        />
      ) : (
        <span className="grid size-6 place-items-center rounded-full bg-white/20 max-[640px]:hidden" aria-hidden="true">
          {(user.displayName || user.email || 'U').slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="max-w-28 truncate max-[640px]:hidden">
        {user.displayName || user.email}
      </span>
      <LogOut size={16} aria-hidden="true" />
    </button>
  )
}
