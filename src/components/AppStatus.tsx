import { RefreshCw } from 'lucide-react'

interface Props {
  message?: string
  onSignOut?: () => void
}

export function AppStatus({ message, onSignOut }: Props) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0c66e4] p-6 text-white">
      <div className="max-w-sm text-center" role={message ? 'alert' : 'status'}>
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-white/15 text-2xl font-bold shadow-lg">
          L
        </div>
        <h1 className="text-2xl font-bold">
          {message ? 'We could not open your workspace' : 'Opening your workspace…'}
        </h1>
        {message && <p className="mt-3 text-sm leading-6 text-white/85">{message}</p>}
        {message && (
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 font-semibold text-[#0c66e4]"
            >
              <RefreshCw size={16} /> Retry
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="h-10 rounded-lg border border-white/50 px-4 font-semibold"
              >
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
