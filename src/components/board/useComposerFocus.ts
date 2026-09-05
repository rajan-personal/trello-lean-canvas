import { useLayoutEffect, useRef } from 'react'

/** Restore the inline trigger after its editor disappears, without stealing outside focus. */
export function useComposerFocus(open: boolean) {
  const container = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = container.current
    if (open) return () => {
      // Defer until React has replaced the composer with its trigger.
      queueMicrotask(() => {
        if (document.activeElement === document.body)
          (element?.isConnected ? element.querySelector<HTMLButtonElement>('button:not(:disabled)') :
            document.getElementById('board-tab'))?.focus()
      })
    }
  }, [open])
  return container
}
