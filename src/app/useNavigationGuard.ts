import { useCallback, useEffect, useRef } from 'react'

export interface DraftGuard { dirty: () => boolean; close: () => boolean }
export type RegisterDraftGuard = (guard: DraftGuard) => () => void

/** All workspace exits share the editor's draft decision; unloading uses the browser prompt. */
export function useNavigationGuard(pending: boolean, notify: (message: string) => void) {
  const guards = useRef(new Set<DraftGuard>())
  const register = useCallback<RegisterDraftGuard>((guard) => {
    guards.current.add(guard)
    return () => { guards.current.delete(guard) }
  }, [])
  const allow = () => {
    if (pending) { notify('Wait for the current save to finish.'); return false }
    return [...guards.current].every((guard) => guard.close())
  }
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (pending || [...guards.current].some((guard) => guard.dirty())) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', unload)
    return () => window.removeEventListener('beforeunload', unload)
  }, [pending])
  return { register, allow }
}
