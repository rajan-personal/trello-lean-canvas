import { useEffect, useRef, useState } from 'react'
import type { BoardData } from '../../data/board'
import { applyBoardCommand, type BoardCommand } from '../../data/board-mutations'
import type { RunBoardCommand } from './board-ui'

/** Local command/snapshot contract, including pending, failure and remote notifications. */
export function useBoardStory(initial: BoardData, command: RunBoardCommand) {
  const [board, setBoard] = useState(initial)
  const latest = useRef(initial)
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const remote = (event: Event) => {
      latest.current = applyBoardCommand(latest.current, (event as CustomEvent<BoardCommand>).detail)
      setBoard(latest.current)
    }
    window.addEventListener('kanban-story:remote', remote)
    return () => window.removeEventListener('kanban-story:remote', remote)
  }, [])
  const run: RunBoardCommand = async (value) => {
    if (busy.current) return false
    busy.current = true
    setPending(true); setError(null)
    try {
      if (!await command(value)) { setError('Changes could not be saved. Your draft is still here.'); return false }
      latest.current = applyBoardCommand(latest.current, value)
      setBoard(latest.current)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Save failed.')
      return false
    } finally { busy.current = false; setPending(false) }
  }
  return { board, pending, error, run }
}
