import {
  useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction,
} from 'react'
import { prepareWorkspace, saveWorkspaceDiff, subscribeToWorkspace } from '../data/firestore'
import type { WorkspaceValue } from '../data/firestore-model'
import { acceptSaveResult, reconcileRemote } from '../data/persistence-state'
import {
  claimStoredCanvases, clearClaimedCanvases,
  readStoredCanvases, writeStoredCanvases,
} from '../data/storage'
import type { LeanCanvas } from '../data/types'

export function usePersistedCanvases(uid: string, persistence: 'firestore' | 'local') {
  const isLocal = persistence === 'local'
  const [canvases, setCanvasState] = useState<LeanCanvas[]>(() =>
    isLocal ? readStoredCanvases() : [])
  const [loading, setLoading] = useState(!isLocal)
  const [error, setError] = useState<string | null>(null)
  const base = useRef<WorkspaceValue | null>(null)
  const current = useRef<LeanCanvas[]>([])
  const saving = useRef<Promise<void> | null>(null)
  useEffect(() => { current.current = canvases }, [canvases])
  const setCanvases: Dispatch<SetStateAction<LeanCanvas[]>> = useCallback((update) => {
    const next = typeof update === 'function' ? update(current.current) : update
    current.current = next
    setCanvasState(next)
  }, [])
  useEffect(() => {
    if (isLocal) return
    let active = true
    let unsubscribe: (() => void) | undefined
    const start = async () => {
      try {
        const local = claimStoredCanvases(uid)
        const migration = await prepareWorkspace(uid, local)
        if (!active) return
        if (migration.consumedLocal) clearClaimedCanvases(uid)
        unsubscribe = subscribeToWorkspace(uid, (remote) => {
          if (!active) return
          if (!base.current) {
            base.current = remote
            current.current = remote.canvases
            setCanvasState(remote.canvases)
          } else {
            const reconciled = reconcileRemote(base.current, current.current, remote)
            base.current = reconciled.value
            current.current = reconciled.canvases
            setCanvasState(reconciled.canvases)
            setError(reconciled.conflictedIds.length
              ? 'Another session changed the same canvas or ordering. Your latest edit will be kept.' : null)
          }
          setLoading(false)
        }, (cause) => {
          if (!active) return
          setLoading(false)
          setError(cause.message || 'Your canvases could not be loaded.')
        })
      } catch (cause) {
        if (!active) return
        setLoading(false)
        setError(cause instanceof Error ? cause.message : 'Your canvases could not be loaded.')
      }
    }
    void start()
    return () => { active = false; unsubscribe?.() }
  }, [isLocal, uid])
  useEffect(() => {
    if (isLocal) { writeStoredCanvases(canvases); return }
    if (loading || !base.current ||
      JSON.stringify(base.current.canvases) === JSON.stringify(canvases)) return
    const target = canvases
    const timer = window.setTimeout(() => {
      const previousSave = saving.current ?? Promise.resolve()
      saving.current = previousSave.catch(() => undefined).then(async () => {
        if (JSON.stringify(target) !== JSON.stringify(current.current) || !base.current) return
        const usedBase = base.current
        const saved = await saveWorkspaceDiff(uid, usedBase, target)
        base.current = acceptSaveResult(base.current, usedBase, saved)
        setError(null)
      }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Changes could not be synced.'))
    }, 450)
    return () => window.clearTimeout(timer)
  }, [canvases, isLocal, loading, uid])
  return { canvases, setCanvases, loading, error }
}
