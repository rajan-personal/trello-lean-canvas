import { useEffect } from 'react'
import type { RegisterDraftGuard } from '../../app/useNavigationGuard'

export function useDraftGuard(dirty: boolean, pending: boolean, onClose: () => void,
  register: RegisterDraftGuard) {
  const close = () => {
    if (pending) return false
    if (dirty && !window.confirm('Discard unsaved changes?')) return false
    onClose()
    return true
  }
  useEffect(() => register({ dirty: () => dirty, close: () => {
    if (pending || (dirty && !window.confirm('Discard unsaved changes?'))) return false
    onClose()
    return true
  } }), [dirty, pending, onClose, register])
  return close
}
