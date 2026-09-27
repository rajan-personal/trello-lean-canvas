import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BoardData } from '../data/board'
import { applyBoardCommand, type BoardCommand } from '../data/board-mutations'
import type { BoardRepository } from '../data/board-repository'

interface BoardView {
  id: string; repository: BoardRepository; board?: BoardData
  loading: boolean; error: string | null
}
// Mount for the selected canvas only. Keep modal drafts outside this persisted snapshot.
export function useBoard(repository: BoardRepository, canvasId: string | undefined) {
  const [view, setView] = useState<BoardView | null>(null)
  const [pending, setPending] = useState(0)
  const [optimisticMove, setOptimisticMove] = useState<{
    id: string; repository: BoardRepository; command: Extract<BoardCommand, { type: 'move-card' }>
  } | null>(null)
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
    const move = command.type === 'move-card' ? { id: canvasId, repository, command } : null
    if (move) setOptimisticMove(move)
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
    } finally {
      if (move) setOptimisticMove((current) => current === move ? null : current)
      setPending((count) => count - 1)
    }
  }, [canvasId, repository, reload])
  const current = view?.id === canvasId && view?.repository === repository ? view : null
  // Project over the latest persisted snapshot so subscription refreshes cannot
  // flash the card back to its source while the write is still in flight.
  const board = useMemo(() => {
    if (!current?.board || optimisticMove?.id !== canvasId || optimisticMove?.repository !== repository)
      return current?.board
    try { return applyBoardCommand(current.board, optimisticMove.command) }
    catch { return current.board } // A remotely deleted card/column must not be resurrected.
  }, [current?.board, optimisticMove, canvasId, repository])
  return { board, loading: !!canvasId && (current?.loading ?? true),
    pending: pending > 0, error: current?.error ?? null, dispatch, reload }
}
