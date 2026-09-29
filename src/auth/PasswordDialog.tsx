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
  return <dialog ref={ref} aria-labelledby="password-title" aria-describedby="password-account"
    className="m-auto max-h-[calc(100dvh-40px)] w-[calc(100%-40px)] max-w-[360px] overflow-y-auto rounded-lg border border-[#e4e4e7] bg-white p-5 text-[#18181b] shadow-lg backdrop:bg-black/40"
    onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy) close() } }}
    onCancel={(event) => { event.preventDefault(); if (!busy) close() }}>
    <div className="flex items-center justify-between gap-4">
      <h2 id="password-title" className="text-base font-semibold">{saved ? 'Password saved' : title}</h2>
      <button type="button" aria-label="Close password settings" disabled={busy} onClick={close}
        className="rounded p-1 hover:bg-[#f1f2f4] focus-visible:outline-2 focus-visible:outline-[#0c66e4] disabled:opacity-50"><X size={20} /></button>
    </div>
    <p id="password-account" className="mt-1 break-all text-sm text-[#71717a]">{email}</p>
    {saved ? <><p role="status" className="mt-4 text-sm text-[#71717a]">You can now sign in with email.</p>
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
        <label className="block text-sm font-medium">New password
          <input className={authInputClass} name="new-password" type="password" autoComplete="new-password" minLength={8} required disabled={busy}
            aria-describedby="password-requirements" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <p id="password-requirements" className="text-xs text-[#71717a]">At least 8 characters.</p>
        <label className="block text-sm font-medium">Confirm password
          <input className={authInputClass} name="confirm-password" type="password" autoComplete="new-password" minLength={8} required disabled={busy}
            value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-[#ae2e24]">{error}</p>}
        <button className={authSubmitClass} type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Verifying and saving…' : 'Verify with Google & save'}</button>
        <p role="status" className="sr-only">{busy ? 'Verify your Google account in the pop-up to save your password.' : ''}</p>
      </form>}
  </dialog>
}
