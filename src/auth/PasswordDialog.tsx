import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { authMessage } from './auth-errors'
import { authInputClass, authSubmitClass } from './EmailSignInForm'

interface Props {
  email: string
  hasPassword: boolean
  onSave: (password: string) => Promise<void>
  onClose: () => void
}
export function PasswordDialog({ email, hasPassword, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const close = () => { ref.current?.close(); onClose() }
  const title = hasPassword ? 'Change password' : 'Set password'
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return <dialog ref={ref} aria-labelledby="password-title" aria-describedby="password-description"
    className="m-auto max-h-[calc(100dvh-40px)] w-[calc(100%-40px)] max-w-[440px] overflow-y-auto rounded-2xl border-0 bg-white p-6 text-[#172b4d] shadow-2xl backdrop:bg-[rgba(9,30,66,0.54)]"
    onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); if (!busy) close() } }}
    onCancel={(event) => { event.preventDefault(); if (!busy) close() }}>
    <div className="flex items-center justify-between gap-4">
      <h2 id="password-title" className="text-xl font-bold">{saved ? 'Password saved' : title}</h2>
      <button type="button" aria-label="Close password settings" disabled={busy} onClick={close}
        className="rounded p-1 hover:bg-[#f1f2f4] focus-visible:outline-2 focus-visible:outline-[#0c66e4] disabled:opacity-50"><X size={20} /></button>
    </div>
    <p className="mt-2 break-all text-sm font-medium text-[#44546f]">{email}</p>
    <p id="password-description" className="mt-3 text-sm leading-6 text-[#626f86]">
      {saved ? 'You can now sign in with Google or your email and password. Your workspace stays the same.' :
        'Verify with Google to save your password. Choose the Google account shown above. Google sign-in will stay available.'}
    </p>
    {saved ? <><p role="status" className="mt-4 text-sm font-semibold text-[#216e4e]">Your password was saved successfully.</p>
      <button type="button" className={`${authSubmitClass} mt-5`} onClick={close}>Done</button></> :
      <form className="mt-5 space-y-4" onSubmit={async (event) => {
        event.preventDefault()
        if (busy) return
        if (password !== confirm) { setError('Passwords do not match.'); return }
        setBusy(true); setError(null)
        try { await onSave(password); setPassword(''); setConfirm(''); setSaved(true) }
        catch (cause) { setError(authMessage(cause, 'Password could not be saved. Please try again.')) }
        finally { setBusy(false) }
      }}>
        <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
        <label className="block text-sm font-semibold">New password
          <input className={authInputClass} name="new-password" type="password" autoComplete="new-password" minLength={8} required disabled={busy}
            aria-describedby="password-requirements" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <p id="password-requirements" className="text-xs text-[#626f86]">Use at least 8 characters.</p>
        <label className="block text-sm font-semibold">Confirm password
          <input className={authInputClass} name="confirm-password" type="password" autoComplete="new-password" minLength={8} required disabled={busy}
            value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-[#ae2e24]">{error}</p>}
        <button className={authSubmitClass} type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Verifying and saving…' : 'Verify with Google and save'}</button>
        <p role="status" className="sr-only">{busy ? 'Verify your Google account in the pop-up to save your password.' : ''}</p>
      </form>}
  </dialog>
}
