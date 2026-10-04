const CHECK_INTERVAL = 60 * 60 * 1000
const MIN_CHECK_INTERVAL = 60 * 1000

// Mobile PWAs can resume without navigating, so registration alone is not enough.
export function watchPwaUpdates(
  registration: ServiceWorkerRegistration,
  onWaiting: () => void = () => {},
) {
  let checking = false
  let lastCheck = -Infinity
  const check = async () => {
    if (document.visibilityState !== 'visible' || !navigator.onLine ||
      registration.installing || checking || Date.now() - lastCheck < MIN_CHECK_INTERVAL) return
    checking = true
    lastCheck = Date.now()
    try {
      if (registration.waiting) {
        onWaiting()
        return
      }
      await registration.update()
      if (registration.waiting) onWaiting()
    } catch {
      // A failed connection must not break the app or cause a reload loop.
    } finally {
      checking = false
    }
  }
  document.addEventListener('visibilitychange', check)
  window.addEventListener('pageshow', check)
  window.addEventListener('online', check)
  const interval = window.setInterval(check, CHECK_INTERVAL)
  void check()
  return () => {
    document.removeEventListener('visibilitychange', check)
    window.removeEventListener('pageshow', check)
    window.removeEventListener('online', check)
    window.clearInterval(interval)
  }
}
