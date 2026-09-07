import { useEffect } from 'react'

/** Canvas pointer dismissal stays unchanged; browser exits must not silently lose drafts. */
export function useCanvasDraftNavigation(dirty: boolean, clear: () => void) {
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', unload)
    return () => window.removeEventListener('beforeunload', unload)
  }, [dirty])
  return () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) return false
    clear()
    return true
  }
}
