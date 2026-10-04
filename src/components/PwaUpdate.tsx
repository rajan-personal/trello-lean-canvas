import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
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
      className="pwa-update fixed right-4 bottom-4 z-120 flex w-[360px] max-w-[calc(100vw-32px)] gap-3 rounded-lg border border-[#dcdfe4] bg-white p-3.5 text-sm text-[#172b4d] shadow-[0_8px_24px_rgba(9,30,66,0.22)] animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none phone:inset-x-3 phone:bottom-[max(12px,env(safe-area-inset-bottom))] phone:w-auto phone:max-w-none">
      <span aria-hidden="true" className="grid size-8 flex-none place-items-center rounded-full bg-[#e9f2ff] text-[#0c66e4]">
        <RefreshCw size={16} strokeWidth={2.25} className={updating ? 'animate-spin motion-reduce:animate-none' : ''} />
      </span>
      <div className="min-w-0 flex-1">
        <p role="status" className="font-semibold leading-5">New version available</p>
        <p className="mt-0.5 leading-5 text-[#44546f]">Updating reloads every open Lean tab. Save your work first.</p>
        {error && <p role="alert" className="mt-2 leading-5 font-medium text-[#ae2e24]">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" disabled={updating} onClick={() => setNeedRefresh(false)}
            className="min-h-8 rounded-[5px] px-3 font-semibold text-[#44546f] hover:bg-[#091e420f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:opacity-60 phone:min-h-11">Later</button>
          <button type="button" disabled={updating} onClick={() => void update()}
            className="min-h-8 rounded-[5px] bg-[#0c66e4] px-3 font-semibold text-white hover:not-disabled:bg-[#0055cc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4] disabled:cursor-progress disabled:opacity-80 phone:min-h-11">
            {updating ? 'Updating…' : 'Update'}
          </button>
        </div>
      </div>
    </section>
  )
}
