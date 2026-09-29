import { useState } from 'react'

export const authInputClass = 'mt-1.5 min-h-10 w-full rounded-md border border-[#e4e4e7] bg-white px-3 py-2 text-sm text-[#18181b] outline-none focus:border-[#a1a1aa] focus:ring-2 focus:ring-[#e4e4e7] disabled:opacity-50'
export const authSubmitClass = 'min-h-10 w-full rounded-md bg-[#18181b] px-4 py-2 text-sm font-medium text-white hover:bg-[#27272a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181b] disabled:cursor-wait disabled:opacity-50'

export function EmailSignInForm({ busy, pending, onSignIn }: { busy: boolean; pending: boolean; onSignIn: (email: string, password: string) => void }) {
  const [help, setHelp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return <form className="space-y-4 text-left" onSubmit={(event) => {
    event.preventDefault()
    if (!busy) onSignIn(email.trim(), password)
  }}>
    <label className="block text-sm font-medium text-[#18181b]">Email
      <input className={authInputClass} type="email" name="email" autoComplete="username" required disabled={busy}
        value={email} onChange={(event) => setEmail(event.target.value)} />
    </label>
    <label className="block text-sm font-medium text-[#18181b]">Password
      <input className={authInputClass} type="password" name="password" autoComplete="current-password" required disabled={busy}
        value={password} onChange={(event) => setPassword(event.target.value)} />
    </label>
    <button className={authSubmitClass} type="submit" disabled={busy} aria-busy={pending}>{pending ? 'Signing in…' : 'Sign in with email'}</button>
    <button type="button" aria-expanded={help} aria-controls="password-help" onClick={() => setHelp(!help)}
      className="block text-xs text-[#71717a] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181b]">Forgot or haven’t set a password?</button>
    {help && <p id="password-help" className="text-xs leading-5 text-[#71717a]">Continue with Google, then open your account menu to set or change your password.</p>}
  </form>
}
