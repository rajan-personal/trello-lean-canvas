import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { saveWorkspace, subscribeToWorkspace } from '../data/firestore'
import {
  claimStoredCanvases,
  clearClaimedCanvases,
  readStoredCanvases,
  writeStoredCanvases,
} from '../data/storage'
import type { LeanCanvas } from '../data/types'

export function usePersistedCanvases(
  uid: string,
  persistence: 'firestore' | 'local',
) {
  const isLocal = persistence === 'local'
  const [canvases, setCanvasState] = useState<LeanCanvas[]>(() =>
    isLocal ? readStoredCanvases() : [],
  )
  const [loading, setLoading] = useState(!isLocal)
  const [error, setError] = useState<string | null>(null)
  const localVersion = useRef(0)
  const syncedVersion = useRef(0)
  const setCanvases: Dispatch<SetStateAction<LeanCanvas[]>> = useCallback(
    (update) => {
      localVersion.current += 1
      setCanvasState(update)
    },
    [],
  )
  useEffect(() => {
    if (isLocal) return
    let firstSnapshot = true
    return subscribeToWorkspace(
      uid,
      (remoteCanvases, exists) => {
        if (localVersion.current > syncedVersion.current) {
          setError('Another session changed this workspace. Your open edits are being kept.')
          return
        }
        const legacy = firstSnapshot && !exists ? claimStoredCanvases(uid) : []
        firstSnapshot = false
        setCanvasState(legacy.length ? legacy : remoteCanvases)
        setLoading(false)
        setError(null)
        if (exists) clearClaimedCanvases(uid)
        if (legacy.length)
          void saveWorkspace(uid, legacy)
            .then(() => clearClaimedCanvases(uid))
            .catch(() => setError('Your local canvases could not be synced.'))
      },
      () => {
        setLoading(false)
        setError('Your canvases could not be loaded. Check your connection.')
      },
    )
  }, [isLocal, uid])
  useEffect(() => {
    if (isLocal) {
      writeStoredCanvases(canvases)
      return
    }
    if (loading || localVersion.current <= syncedVersion.current) return
    const version = localVersion.current
    const timer = window.setTimeout(() => {
      void saveWorkspace(uid, canvases)
        .then(() => {
          syncedVersion.current = Math.max(syncedVersion.current, version)
          if (localVersion.current === version) setError(null)
        })
        .catch(() =>
          setError('Changes could not be synced. They remain open in this tab.'),
        )
    }, 450)
    return () => window.clearTimeout(timer)
  }, [canvases, isLocal, loading, uid])
  return { canvases, setCanvases, loading, error }
}
