import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { drawerQuery as query } from '../lib/breakpoints'

const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const snapshot = () => window.matchMedia(query).matches

export function useSidebarVisibility(open: boolean, collapsed: boolean) {
  const drawer = useSyncExternalStore(subscribe, snapshot, () => false)
  const hidden = drawer ? !open : collapsed
  const ref = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const sidebar = ref.current
    if (!sidebar) return
    if (hidden && sidebar.contains(document.activeElement)) {
      const controls = document.querySelectorAll<HTMLButtonElement>('button[aria-controls="canvas-sidebar"]')
      Array.from(controls).find((button) => button.getClientRects().length)?.focus()
    } else if (drawer && !hidden) {
      sidebar.querySelector<HTMLButtonElement>('button')?.focus()
    }
  }, [hidden, drawer])
  return { ref, hidden, drawer }
}
