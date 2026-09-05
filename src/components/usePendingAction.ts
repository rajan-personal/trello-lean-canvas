import { useEffect, useRef, useState } from 'react'

export function usePendingAction(action: () => void | Promise<void>) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const active = useRef(true)
  const running = useRef(false)
  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])
  const run = async () => {
    if (running.current) return
    running.current = true
    setPending(true)
    setFailed(false)
    try { await action() } catch {
      if (active.current) setFailed(true)
    } finally {
      running.current = false
      if (active.current) setPending(false)
    }
  }
  return { pending, failed, run }
}
