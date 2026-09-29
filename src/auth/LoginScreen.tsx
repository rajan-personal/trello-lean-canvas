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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  return (
    <main className="grid min-h-dvh place-items-center bg-linear-[135deg,#0747a6_0%,#0c66e4_48%,#579dff_100%] p-5">
      <section className="w-full max-w-[420px] rounded-3xl border border-white/35 bg-white p-8 text-center shadow-[0_24px_70px_rgba(9,30,66,0.35)] sm:p-10">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[#0c66e4] text-2xl font-bold text-white shadow-lg">
          L
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#172b4d]">Lean Canvas</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#44546f]">
          Shape, test, and sync your business model from one focused workspace.
        </p>
        <div className="mt-6 flex rounded-lg bg-[#f1f2f4] p-1" role="group" aria-label="Account access">
          {(['signin', 'signup'] as const).map((value) => <button key={value} type="button" disabled={busy}
            aria-pressed={mode === value} onClick={() => setMode(value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#0c66e4] ${mode === value ? 'bg-white text-[#172b4d] shadow-sm' : 'text-[#626f86]'}`}>
            {value === 'signin' ? 'Sign in' : 'Sign up'}
          </button>)}
        </div>
        <button
          type="button"
          onClick={() => { setEmailPending(false); onSignIn() }}
          disabled={busy}
          aria-busy={busy}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#c7d1e0] bg-white px-5 font-semibold text-[#172b4d] shadow-sm transition hover:bg-[#f7f8f9] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:cursor-wait disabled:opacity-65"
        >
          <GoogleMark />
          {busy && !emailPending ? 'Connecting to Google…' : 'Continue with Google'}
        </button>
        {mode === 'signin' ? <><div className="mt-5 flex items-center gap-3 text-xs text-[#626f86]"><span className="h-px flex-1 bg-[#dcdfe4]" />or use email<span className="h-px flex-1 bg-[#dcdfe4]" /></div>
          <EmailSignInForm busy={busy} onSignIn={(email, password) => { setEmailPending(true); onEmailSignIn(email, password) }} /></> :
          <p className="mt-5 text-sm leading-6 text-[#44546f]">Create your account with Google. You can add a password in your workspace to sign in with email later.</p>}
        <p role="status" aria-atomic="true" className="sr-only">{busy ? emailPending ? 'Signing in with email…' : 'Connecting to Google…' : ''}</p>
        {error && <p className="mt-4 text-sm font-medium text-[#ae2e24]" role="alert">{error}</p>}
        <p className="mt-7 text-xs leading-5 text-[#626f86]">Your canvases are private and synced to your account.</p>
      </section>
    </main>
  )
}
