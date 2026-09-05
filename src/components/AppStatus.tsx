import { RefreshCw } from 'lucide-react'
import { usePendingAction } from './usePendingAction'

interface Props {
  message?: string
  onSignOut?: () => void | Promise<void>
  onRetry?: () => void | Promise<void>
}

export function AppStatus({ message, onSignOut, onRetry = () => window.location.reload() }: Props) {
  const retry = usePendingAction(onRetry)
  const signOut = usePendingAction(onSignOut ?? (() => {}))
  const pending = retry.pending || signOut.pending
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0c66e4] p-6 text-white">
      <div className="max-w-sm text-center" role={message ? 'alert' : 'status'}>
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-white/15 text-2xl font-bold shadow-lg">
          L
        </div>
        <h1 className="text-2xl font-bold">
          {message ? 'We could not open your workspace' : 'Opening your workspace…'}
        </h1>
        {message && <p className="mt-3 text-sm leading-6 text-white/95">{message}</p>}
        {message && (
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void retry.run()}
              disabled={pending}
              aria-busy={retry.pending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 font-semibold text-[#0c66e4]"
            >
              <RefreshCw size={16} aria-hidden="true" /> {retry.pending ? 'Retrying…' : 'Retry'}
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={() => void signOut.run()}
                disabled={pending}
                aria-busy={signOut.pending}
                className="h-10 rounded-lg border border-white/50 px-4 font-semibold"
              >
                {signOut.pending ? 'Signing out…' : 'Sign out'}
              </button>
            )}
          </div>
        )}
        {(retry.failed || signOut.failed) && <p className="mt-4" role="alert">
          {retry.failed ? 'Retry failed. Please try again.' : 'Sign out failed. Please try again.'}
        </p>}
      </div>
    </main>
  )
}
