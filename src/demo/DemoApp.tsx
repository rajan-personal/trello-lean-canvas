import { useState, type FormEvent } from 'react'
import { Workspace } from '../app/Workspace'
import { demoEmail, demoPassword, demoUser, seedDemoWorkspace } from './demo-data'

const sessionKey = 'lean-demo:tickets-first:session'
function hasSession() {
  try { return sessionStorage.getItem(sessionKey) === 'true' } catch { return false }
}

/** Demo build only: public, browser-local sandbox; never authenticates to Firebase. */
export default function DemoApp({ browserRouting = true }: { browserRouting?: boolean }) {
  const [signedIn, setSignedIn] = useState(hasSession)
  const [error, setError] = useState('')
  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (String(form.get('email')).trim().toLowerCase() !== demoEmail || form.get('password') !== demoPassword) {
      setError('Use the sample email and password shown below.')
      return
    }
    try {
      seedDemoWorkspace()
      sessionStorage.setItem(sessionKey, 'true')
      setError('')
      setSignedIn(true)
    } catch { setError('Browser storage is unavailable. Allow site storage and try again.') }
  }
  if (signedIn) return <Workspace user={demoUser} persistence="local" browserRouting={browserRouting}
    onSignOut={() => {
      sessionStorage.removeItem(sessionKey)
      setSignedIn(false)
    }} />
  return <main className="grid min-h-dvh place-items-center bg-[#f4f5f7] p-6 text-[#172b4d]">
    <section aria-labelledby="demo-heading" className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
      <h1 id="demo-heading" className="text-2xl font-bold">Tickets-first preview</h1>
      <p className="my-4">Public demo with sample data. Edits stay in this browser, not in production. Do not enter real credentials or sensitive data.</p>
      <form onSubmit={signIn} className="grid gap-3">
        <label htmlFor="demo-email">Email</label>
        <input id="demo-email" name="email" type="email" autoComplete="username" required
          className="rounded border border-slate-500 p-2" aria-describedby="demo-credentials" />
        <label htmlFor="demo-password">Password</label>
        <input id="demo-password" name="password" type="password" autoComplete="current-password" required
          className="rounded border border-slate-500 p-2" aria-describedby="demo-credentials" />
        <p role="alert" className="text-red-700">{error}</p>
        <button type="submit" className="rounded bg-[#0c66e4] p-3 font-semibold text-white hover:bg-[#0055cc]">Sign in to demo</button>
      </form>
      <p id="demo-credentials" className="mt-4 text-sm">Sample login: <code>{demoEmail}</code><br />Password: <code>{demoPassword}</code></p>
    </section>
  </main>
}
