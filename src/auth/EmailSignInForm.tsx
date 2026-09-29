import { useState } from 'react'

export const authInputClass = 'mt-1.5 w-full rounded-lg border border-[#8590a2] bg-white px-3 py-2.5 text-sm text-[#172b4d] outline-none focus:border-[#0c66e4] focus:ring-1 focus:ring-[#0c66e4] disabled:opacity-65'
export const authSubmitClass = 'min-h-11 w-full rounded-lg bg-[#0c66e4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0055cc] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:cursor-wait disabled:opacity-65'

export function EmailSignInForm({ busy, onSignIn }: { busy: boolean; onSignIn: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return <form className="mt-5 space-y-4 text-left" onSubmit={(event) => {
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
    <button className={authSubmitClass} type="submit" disabled={busy}>Sign in with email</button>
    <p className="text-xs leading-5 text-[#626f86]">No password yet or forgot it? Continue with Google, then set or change your password inside your workspace.</p>
  </form>
}
