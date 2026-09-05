import type { AppUser } from '../auth/auth-context'
import { usePendingAction } from './usePendingAction'
import { SyncError } from './SyncError'

interface Props {
  user: AppUser
  onSignOut: () => void | Promise<void>
}

export function AccountButton({ user, onSignOut }: Props) {
  const { pending, failed, run } = usePendingAction(onSignOut)
  const name = user.displayName || user.email || 'Google account'
  const email = user.email && user.email !== name ? user.email : null
  const signOutLabel = user.email || user.displayName || 'Google account'

  return (
    <><div className="sidebar-account flex min-w-0 items-center gap-2.5 px-2 py-2">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          referrerPolicy="no-referrer"
          className="size-8 flex-none rounded-full bg-white/15 ring-1 ring-white/20"
        />
      ) : (
        <span
          className="grid size-8 flex-none place-items-center rounded-full bg-white/15 text-xs font-semibold text-white ring-1 ring-white/15"
          aria-hidden="true"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <span title={name} className="block truncate text-[13px] leading-4 font-semibold text-white">
          {name}
        </span>
        {email && (
          <span title={email} className="block truncate text-[11px] leading-4 text-white/75">
            {email}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => void run()}
        disabled={pending}
        aria-busy={pending}
        className="flex-none rounded px-1.5 py-1 text-[11px] leading-4 font-medium text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
        aria-label={`${pending ? 'Signing out' : 'Sign out'} ${signOutLabel}`}
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
    {failed && <SyncError message="Sign out failed. Please try again." />}</>
  )
}
