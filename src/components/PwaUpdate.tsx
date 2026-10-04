import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { watchPwaUpdates } from '../lib/pwa-updates'

const updateProbe = 'lean:pwa-update-probe'
const promptReady = 'lean:pwa-prompt-ready'

export function PwaUpdate() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const reloading = useRef(false)
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW: (_url, value) => {
      setRegistration(value)
      value?.installing?.postMessage({ type: promptReady })
    },
    onNeedReload: () => {},
  })
  useEffect(() => registration && watchPwaUpdates(
    registration,
    () => setNeedRefresh(true),
  ), [registration, setNeedRefresh])

  // Let a newly installing worker distinguish this prompt-aware client from
  // older releases that must be updated automatically once.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const reply = (event: MessageEvent) => {
      if (event.data?.type === updateProbe)
        (event.source as ServiceWorker | null)?.postMessage({ type: promptReady })
    }
    navigator.serviceWorker.addEventListener('message', reply)
    return () => navigator.serviceWorker.removeEventListener('message', reply)
  }, [])

  // A worker activation affects every controlled tab. Reload each one so an old
  // page never runs against a new worker and a different precache manifest.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let controlled = Boolean(navigator.serviceWorker.controller)
    const changed = () => {
      if (controlled) {
        if (!reloading.current) {
          reloading.current = true
          window.location.reload()
        }
      }
      controlled = true
    }
    navigator.serviceWorker.addEventListener('controllerchange', changed)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', changed)
  }, [setNeedRefresh])

  useEffect(() => {
    if (!updating) return
    const timer = window.setTimeout(() => {
      setUpdating(false)
      setError('Update is taking longer than expected. Please try again.')
    }, 15_000)
    return () => window.clearTimeout(timer)
  }, [updating])

  const update = async () => {
    setUpdating(true)
    setError('')
    try {
      const current = registration ?? await navigator.serviceWorker.ready
      if (current.waiting) await updateServiceWorker(true)
      else window.location.reload()
    } catch {
      setUpdating(false)
      setError('Update failed. Please try again.')
    }
  }
  if (!needRefresh) return null
  return (
    <section role="region" aria-label="App update"
      className="fixed inset-x-4 bottom-[max(80px,env(safe-area-inset-bottom))] z-120 mx-auto max-w-sm rounded-lg bg-[#172b4d] p-4 text-sm text-white shadow-xl">
      <p role="status" className="font-semibold">New version available</p>
      <p className="mt-1 text-white/80">Save work in all open tabs before updating.</p>
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
