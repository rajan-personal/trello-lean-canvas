import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { watchPwaUpdates } from '../lib/pwa-updates'

export function PwaUpdate() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const accepted = useRef(false)
  const reloading = useRef(false)
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW: (_url, value) => setRegistration(value),
    // Handle controller changes below, including workers installed by another tab.
    onNeedReload: () => {},
  })
  useEffect(() => registration && watchPwaUpdates(registration), [registration])

  // If another tab activates the worker, offer a reload without interrupting edits.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let controlled = Boolean(navigator.serviceWorker.controller)
    const changed = () => {
      if (controlled) {
        if (accepted.current && !reloading.current) {
          reloading.current = true
          window.location.reload()
        } else setNeedRefresh(true)
      }
      controlled = true
    }
    navigator.serviceWorker.addEventListener('controllerchange', changed)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', changed)
  }, [setNeedRefresh])

  useEffect(() => {
    if (!updating) return
    const timer = window.setTimeout(() => {
      accepted.current = false
      setUpdating(false)
      setError('Update is taking longer than expected. Please try again.')
    }, 15_000)
    return () => window.clearTimeout(timer)
  }, [updating])

  const update = async () => {
    accepted.current = true
    setUpdating(true)
    setError('')
    try {
      if (registration?.waiting) await updateServiceWorker(true)
      else window.location.reload()
    } catch {
      accepted.current = false
      setUpdating(false)
      setError('Update failed. Please try again.')
    }
  }
  if (!needRefresh) return null
  return (
    <section role="region" aria-label="App update"
      className="fixed inset-x-4 bottom-[max(80px,env(safe-area-inset-bottom))] z-120 mx-auto max-w-sm rounded-lg bg-[#172b4d] p-4 text-sm text-white shadow-xl">
      <p role="status" className="font-semibold">New version available</p>
      <p className="mt-1 text-white/80">Finish and save your edits before updating.</p>
      {error && <p role="alert" className="mt-2">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={updating} onClick={() => void update()}
          className="min-h-11 rounded bg-white px-4 font-semibold text-[#172b4d] disabled:opacity-60">
          {updating ? 'Updating…' : 'Update'}
        </button>
        <button type="button" disabled={updating} onClick={() => setNeedRefresh(false)}
          className="min-h-11 rounded px-4 hover:bg-white/10 disabled:opacity-60">Later</button>
      </div>
    </section>
  )
}
