import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { prepareWorkspace, subscribeToWorkspace } from '../data/firestore'
import { migrationCanvases, type WorkspaceValue } from '../data/firestore-model'
import { reconcileRemote } from '../data/persistence-state'
import type { BoardRepository } from '../data/board-repository'
import { readLocalBoards } from '../data/board-storage'
import { claimStoredCanvases, clearClaimedCanvases } from '../data/storage'
import type { LeanCanvas } from '../data/types'

interface Options {
  uid: string; isLocal: boolean; boards: BoardRepository
  base: MutableRefObject<WorkspaceValue | null>; current: MutableRefObject<LeanCanvas[]>
  ready: MutableRefObject<boolean>; setCanvases: Dispatch<SetStateAction<LeanCanvas[]>>
  setLoading: (value: boolean) => void; setError: (value: string | null) => void
}
export function startCanvasPersistence({ uid, isLocal, boards, base, current, ready, setCanvases, setLoading, setError }: Options) {
    let active = true
    let unsubscribe: (() => void) | undefined
    let remoteSequence = 0
    const withPending = (values: LeanCanvas[]) => {
      const existing = new Set(values.map(({ id }) => id))
      return [...values, ...boards.pendingImports().flatMap(({ canvas }) => existing.has(canvas.id) ? [] : [canvas])]
    }
    const start = async () => {
      try {
        if (isLocal) {
          setCanvases(withPending(current.current))
          ready.current = true
          setLoading(false)
          return
        }
        const local = claimStoredCanvases(uid)
        const localBoards = local.length ? readLocalBoards() : {}
        const migration = await prepareWorkspace(uid, local, localBoards)
        if (!active) return
        if (migration.consumedLocal) {
          const migrated = await migrationCanvases(local)
          const staged = new Set(boards.pendingImports().map(({ canvas }) => canvas.id))
          migrated.forEach((canvas, index) => {
            if (Object.hasOwn(localBoards, local[index].id) && !staged.has(canvas.id))
              boards.stageImport(canvas, localBoards[local[index].id], `local-migration-${canvas.id}`)
          })
          // Keep the claim until the board copies are durable as well.
          await boards.sync(migrated)
          clearClaimedCanvases(uid)
        }
        if (!active) return
        unsubscribe = subscribeToWorkspace(uid, (remote) => {
          const sequence = ++remoteSequence
          void (async () => {
            if (!active) return
            if (!base.current) {
              const deleting = new Set(await boards.deletingCanvasIds(remote.canvases.map(({ id }) => id)))
              if (!active || sequence !== remoteSequence) return
              base.current = remote
              setCanvases(withPending(remote.canvases).filter(({ id }) => !deleting.has(id)))
              setError(null)
            } else {
              const reconciled = reconcileRemote(base.current, current.current, remote)
              base.current = reconciled.value
              setCanvases(reconciled.canvases)
              if (reconciled.conflictedIds.length)
                setError('Another session changed the same canvas or ordering. Your latest edit will be kept.')
            }
            ready.current = true
            setLoading(false)
          })().catch((cause: unknown) => {
            if (active) { setLoading(false); setError(cause instanceof Error ? cause.message : 'Your canvases could not be loaded.') }
          })
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
    return () => { active = false; ready.current = false; unsubscribe?.() }
}
