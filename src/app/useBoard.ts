import { useCallback, useEffect, useRef, useState } from 'react'
import type { BoardData } from '../data/board'
import type { BoardCommand } from '../data/board-mutations'
import type { BoardRepository } from '../data/board-repository'

interface BoardView {
  id: string; repository: BoardRepository; board?: BoardData
  loading: boolean; error: string | null
}
// Mount for the selected canvas only. Keep modal drafts outside this persisted snapshot.
export function useBoard(repository: BoardRepository, canvasId: string | undefined) {
  const [view, setView] = useState<BoardView | null>(null)
  const [pending, setPending] = useState(0)
  const generation = useRef(0)
  const request = useRef(0)
  const reload = useCallback(async () => {
    if (!canvasId) return
    const token = ++request.current
    const scope = generation.current
    setView((previous) => ({ id: canvasId, repository, loading: true, error: null,
      board: previous?.id === canvasId && previous.repository === repository ? previous.board : undefined }))
    try {
      const board = await repository.load(canvasId)
      if (token !== request.current || scope !== generation.current) return
      setView({ id: canvasId, repository, board, loading: false, error: null })
    } catch (cause) {
      if (token === request.current && scope === generation.current)
        setView((previous) => ({ id: canvasId, repository, loading: false,
          board: previous?.id === canvasId && previous.repository === repository ? previous.board : undefined,
          error: cause instanceof Error ? cause.message : 'Board could not be loaded.' }))
    }
  }, [canvasId, repository])
  useEffect(() => {
    const scope = ++generation.current
    if (!canvasId) return
    const stop = repository.subscribe(canvasId, () => {
      if (scope === generation.current) void reload()
    }, (cause) => {
      if (scope === generation.current)
        setView((previous) => ({ id: canvasId, repository, loading: false,
          board: previous?.id === canvasId && previous.repository === repository ? previous.board : undefined,
          error: cause.message }))
    })
    return () => { generation.current = scope + 1; stop() }
  }, [canvasId, repository, reload])
  const dispatch = useCallback(async (command: BoardCommand): Promise<void> => {
    if (!canvasId) throw new Error('Select a canvas first.')
    const scope = generation.current
    setPending((count) => count + 1)
    try {
      await repository.dispatch(canvasId, command)
      if (scope === generation.current) await reload()
    } catch (cause) {
      const latest = await repository.load(canvasId).catch(() => undefined)
      if (scope === generation.current)
        setView((previous) => ({ id: canvasId, repository, board: latest ?? previous?.board, loading: false,
          error: cause instanceof Error ? cause.message : 'Board change could not be saved.' }))
      throw cause
    } finally { setPending((count) => count - 1) }
  }, [canvasId, repository, reload])
  const current = view?.id === canvasId && view?.repository === repository ? view : null
  return { board: current?.board, loading: !!canvasId && (current?.loading ?? true),
    pending: pending > 0, error: current?.error ?? null, dispatch, reload }
}
