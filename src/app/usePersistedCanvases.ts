import {
  useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction,
} from 'react'
import { saveWorkspaceDiff } from '../data/firestore'
import { startCanvasPersistence } from './canvas-persistence-start'
import { type WorkspaceValue } from '../data/firestore-model'
import { acceptSaveResult } from '../data/persistence-state'
import { createBoardRepository } from '../data/board-repository'
import {
  readStoredCanvases, writeStoredCanvases,
} from '../data/storage'
import type { LeanCanvas } from '../data/types'

export function usePersistedCanvases(uid: string, persistence: 'firestore' | 'local') {
  const isLocal = persistence === 'local'
  const boards = useMemo(() => createBoardRepository(uid, persistence), [uid, persistence])
  const [canvases, setCanvasState] = useState<LeanCanvas[]>(() =>
    isLocal ? readStoredCanvases() : [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const base = useRef<WorkspaceValue | null>(null)
  const current = useRef(canvases)
  const localBase = useRef(canvases)
  const ready = useRef(false)
  const saving = useRef<Promise<void> | null>(null)
  const setCanvases: Dispatch<SetStateAction<LeanCanvas[]>> = useCallback((update) => {
    const next = typeof update === 'function' ? update(current.current) : update
    current.current = next
    setCanvasState(next)
  }, [])
  const setUserCanvases: Dispatch<SetStateAction<LeanCanvas[]>> = useCallback((update) => {
    const next = typeof update === 'function' ? update(current.current) : update
    if (next === current.current) return
    setScheduled(true)
    setCanvases(next)
  }, [setCanvases])
  const flushCanvases = useCallback((): Promise<void> => {
    const work = (saving.current ?? Promise.resolve()).catch(() => undefined).then(async () => {
      if (!ready.current) throw new Error('Canvases are still loading. Retry shortly.')
      setScheduled(false)
      setPending(true)
      try {
        const target = current.current
        const previous = isLocal ? localBase.current : base.current?.canvases ?? []
        if (isLocal) {
          writeStoredCanvases(target)
          localBase.current = target
        } else {
          if (!base.current) throw new Error('Workspace has not loaded.')
          if (JSON.stringify(base.current.canvases) !== JSON.stringify(target)) {
            const usedBase = base.current
            const saved = await saveWorkspaceDiff(uid, usedBase, target, boards.pendingImports())
            base.current = acceptSaveResult(base.current, usedBase, saved)
          }
        }
        const nextIds = new Set(target.map(({ id }) => id))
        boards.removeLocal(previous.flatMap(({ id }) => nextIds.has(id) ? [] : [id]))
        // Wake a board opened before its new canvas finished saving, without touching old boards.
        const previousIds = new Set(previous.map(({ id }) => id))
        await boards.sync(target, target.flatMap(({ id }) => previousIds.has(id) ? [] : [id]))
        setError(null)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Changes could not be synced.')
        throw cause
      } finally { setPending(false) }
    })
    saving.current = work
    return work
  }, [boards, isLocal, uid])
  useEffect(() => startCanvasPersistence({ uid, isLocal, boards, base, current, ready,
    setCanvases, setLoading, setError }), [boards, isLocal, uid, setCanvases])
  useEffect(() => {
    if (loading || !ready.current) return
    const timer = window.setTimeout(() => { void flushCanvases().catch(() => undefined) }, isLocal ? 0 : 450)
    return () => window.clearTimeout(timer)
  }, [canvases, isLocal, loading, flushCanvases])
  return { canvases, setCanvases: setUserCanvases, loading, error, pending: pending || scheduled, boards, flushCanvases }
}
