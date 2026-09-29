import { useState } from 'react'
import { EmailSignInForm } from './EmailSignInForm'

interface Props {
  busy: boolean
  error: string | null
  onSignIn: () => void
  onEmailSignIn: (email: string, password: string) => void
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path fill="#4285f4" d="M22.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h6a5.2 5.2 0 0 1-2.2 3.3v2.8h3.6c2.1-2 3.2-4.8 3.2-8.2Z" />
      <path fill="#34a853" d="M12 23c3 0 5.5-1 7.4-2.6l-3.6-2.8c-1 .7-2.3 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2v2.9A11.2 11.2 0 0 0 12 23Z" />
      <path fill="#fbbc05" d="M5.7 14a6.6 6.6 0 0 1 0-4V7.1H2A11.2 11.2 0 0 0 2 17l3.7-3Z" />
      <path fill="#ea4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.7L19.5 4A10.8 10.8 0 0 0 2 7.1l3.7 2.9c.9-2.7 3.4-4.6 6.3-4.6Z" />
    </svg>
  )
}

export function LoginScreen({ busy, error, onSignIn, onEmailSignIn }: Props) {
  const [emailPending, setEmailPending] = useState(false)
  return (
    <main className="grid min-h-dvh place-items-center bg-white px-6 py-10 text-[#18181b]">
      <section className="w-full max-w-[320px]">
        <h1 className="text-center text-xl font-semibold tracking-tight">Sign in to Lean Canvas</h1>
        <button type="button" onClick={() => { setEmailPending(false); onSignIn() }} disabled={busy}
          aria-busy={busy && !emailPending}
          className="mt-6 flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#e4e4e7] bg-white px-3 text-sm font-medium hover:bg-[#f4f4f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181b] disabled:opacity-50">
          <GoogleMark />{busy && !emailPending ? 'Connecting to Google…' : 'Continue with Google'}
        </button>
        <p className="mt-2 text-center text-xs text-[#71717a]">New here? Create your account with Google.</p>
        <div className="my-5 flex items-center gap-3 text-xs text-[#71717a]"><span className="h-px flex-1 bg-[#e4e4e7]" />or<span className="h-px flex-1 bg-[#e4e4e7]" /></div>
        <EmailSignInForm busy={busy} pending={busy && emailPending}
          onSignIn={(email, password) => { setEmailPending(true); onEmailSignIn(email, password) }} />
        <p role="status" aria-atomic="true" className="sr-only">{busy ? emailPending ? 'Signing in with email…' : 'Connecting to Google…' : ''}</p>
        {error && <p className="mt-4 text-sm text-[#b91c1c]" role="alert">{error}</p>}
      </section>
    </main>
  )
}
