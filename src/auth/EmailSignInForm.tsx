import { useState } from 'react'

export const authInputClass = 'mt-1.5 w-full rounded-md border-2 border-[#8590a2] bg-white px-3 py-2.5 text-sm text-[#172b4d] outline-none focus:border-[#0c66e4] disabled:opacity-65'
export const authSubmitClass = 'min-h-11 w-full rounded-lg bg-[#0c66e4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0055cc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:cursor-wait disabled:opacity-65'

export function EmailSignInForm({ busy, pending, onSignIn }: { busy: boolean; pending: boolean; onSignIn: (email: string, password: string) => void }) {
  const [help, setHelp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return <form className="space-y-4 text-left" onSubmit={(event) => {
    event.preventDefault()
    if (!busy) onSignIn(email.trim(), password)
  }}>
    <label className="block text-sm font-semibold text-[#172b4d]">Email
      <input className={authInputClass} type="email" name="email" autoComplete="username" required disabled={busy}
        value={email} onChange={(event) => setEmail(event.target.value)} />
    </label>
    <label className="block text-sm font-semibold text-[#172b4d]">Password
      <input className={authInputClass} type="password" name="password" autoComplete="current-password" required disabled={busy}
        value={password} onChange={(event) => setPassword(event.target.value)} />
    </label>
    <button className={authSubmitClass} type="submit" disabled={busy} aria-busy={pending}>{pending ? 'Signing in…' : 'Sign in with email'}</button>
    <button type="button" aria-expanded={help} aria-controls="password-help" onClick={() => setHelp(!help)}
      className="block text-xs text-[#626f86] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4]">Forgot or haven’t set a password?</button>
    {help && <p id="password-help" className="text-xs leading-5 text-[#626f86]">Continue with Google, then open your account menu to set or change your password.</p>}
  </form>
}
